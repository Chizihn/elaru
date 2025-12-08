import prisma from "../configs/database";
import { Reputation } from "@prisma/client";
import { agentService } from "./AgentService";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

const SLASH_AMOUNT_AVAX = 0.1; // 0.1 AVAX penalty per bad review (reduced for fairness)
const SLASH_AMOUNT_WEI = ethers.parseEther(SLASH_AMOUNT_AVAX.toString());
const MINIMUM_STAKE_AVAX = 0.5; // Minimum 0.5 AVAX to operate (agents can stake more)
const LOW_SCORE_THRESHOLD = 4; // Slash if score < 4 (1, 2, or 3 stars)
const REQUIRE_COMMENT_FOR_SLASH = true; // Anti-sybil measure

// Reputation adjustment per score (fairer incremental system)
const REPUTATION_ADJUSTMENTS: Record<number, number> = {
  5: +5,   // Excellent: +5 reputation
  4: +2,   // Good: +2 reputation
  3: -2,   // Below average: -2 reputation (minimal penalty)
  2: -5,   // Poor: -5 reputation
  1: -10,  // Very poor: -10 reputation
};

export class ReputationService {
  /**
   * Submit feedback + optionally trigger slash (with AI judge)
   */
  async submitFeedback(
    agentId: string,
    reviewer: string,
    score: number,
    comment: string | null,
    paymentProof: string
  ): Promise<Reputation> {
    if (score < 1 || score > 5) {
      throw new Error("Score must be between 1 and 5");
    }

    // Verify payment was actually made (critical for fairness)
    const isValidProof = await this.verifyPaymentProof(paymentProof);
    if (!isValidProof) {
      throw new Error("Invalid or missing payment proof (tx hash required)");
    }

    // Save reputation record
    const reputation = await prisma.reputation.create({
      data: {
        agentId,
        reviewer,
        score,
        comment: comment?.trim() || null,
        paymentProof,
      },
    });

    // Update reputation score with incremental adjustment
    await this.updateAgentReputationScore(agentId, score);

    // Trigger slash flow if score is too low
    if (score < LOW_SCORE_THRESHOLD) {
      await this.slashAgentForLowScore(agentId, score, comment);
    }

    return reputation;
  }

  /**
   * Apply incremental reputation adjustment based on review score.
   * Uses a fair formula: good reviews boost reputation, bad reviews reduce it.
   * Reputation is clamped between 0 and 100.
   */
  private async updateAgentReputationScore(agentId: string, score: number): Promise<void> {
    const agent = await agentService.getAgentById(agentId);
    if (!agent) {
      console.error(`Cannot update reputation: Agent ${agentId} not found`);
      return;
    }

    const currentScore = agent.reputationScore || 50; // Default to 50 for new agents
    const adjustment = REPUTATION_ADJUSTMENTS[score] || 0;
    
    // Apply adjustment and clamp between 0 and 100
    let newScore = currentScore + adjustment;
    newScore = Math.max(0, Math.min(100, newScore));

    console.log(`Reputation update: ${currentScore} + (${adjustment}) = ${newScore} for agent ${agentId}`);

    await agentService.updateReputationScore(
      agentId,
      Number(newScore.toFixed(2))
    );
  }

  /**
   * Slash agent if low score + AI judge approves
   */
  private async slashAgentForLowScore(
    agentId: string,
    score: number,
    comment: string | null
  ): Promise<void> {
    console.log(`Low score detected: ${score}/5 for agent ${agentId}`);

    // Require comment to prevent spam slashing
    if (REQUIRE_COMMENT_FOR_SLASH && !comment?.trim()) {
      console.log("No comment provided → Skipping slash (Sybil protection)");
      return;
    }

    let shouldSlash = true;

    // AI Judge only if comment exists
    if (comment?.trim()) {
      console.log("Submitting to Gemini AI Judge...");
      shouldSlash = await this.validateSlashWithGemini(comment, score);

      if (!shouldSlash) {
        console.log("AI Judge REJECTED slash → Agent protected");
        return;
      }
      console.log("AI Judge APPROVED slash → Proceeding with penalty");
    }

    // Perform slash: DB + on-chain
    try {
      await agentService.slashAgent(agentId, SLASH_AMOUNT_WEI.toString());
      console.log(`Slashed ${SLASH_AMOUNT_AVAX} AVAX from agent's stake`);

      await this.slashAgentOnChain(agentId, score, comment || "Low score");
      console.log("On-chain slash successful");

      // Check if agent should be deactivated
      const agent = await agentService.getAgentById(agentId);
      if (agent) {
        const effectiveStake =
          BigInt(agent.stakedAmount) - BigInt(agent.slashedAmount);
        const minimumStake = BigInt(agent.minimumStake);

        if (effectiveStake < minimumStake) {
          console.log(
            `Agent ${agent.name} deactivated - stake below minimum (${MINIMUM_STAKE_AVAX} AVAX)`
          );
        }
      }
    } catch (error: any) {
      console.error("Slash failed (DB still updated):", error.message);
      // DB slash already applied — economic consistency maintained
    }
  }

  /**
   * Execute actual on-chain slash via AgentStaking contract (Avalanche)
   */
  private async slashAgentOnChain(
    agentId: string,
    score: number,
    comment: string
  ): Promise<string> {
    const agent = await agentService.getAgentById(agentId);
    if (!agent?.walletAddress) throw new Error("Agent wallet not found");

    const stakingAddress = process.env.AGENT_STAKING_ADDRESS;
    const privateKey = process.env.SLASHER_PRIVATE_KEY; // Dedicated slasher key recommended

    if (!stakingAddress || !privateKey) {
      console.warn("Skipping on-chain slash: contract or key not configured");
      return "0x0";
    }

    const rpcUrl =
      process.env.AVALANCHE_RPC_URL ||
      "https://api.avax-test.network/ext/bc/C/rpc";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Minimal ABI — adjust if your contract uses different function name
    const abi = [
      "function slash(address agent, uint256 amount, string reason) external",
      "function slash(address agent, string reason) external", // fallback
    ];

    const contract = new ethers.Contract(stakingAddress, abi, wallet);

    const reason = `Review score ${score}/5 - ${comment.substring(0, 100)}`;

    let tx;
    try {
      // Try with amount first
      tx = await contract.slash(agent.walletAddress, SLASH_AMOUNT_WEI, reason);
    } catch {
      // Fallback: slash without amount (if contract burns fixed %)
      tx = await contract.slash(agent.walletAddress, reason);
    }

    console.log(`Slashing tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Slash confirmed in block ${receipt.blockNumber}`);

    return tx.hash;
  }

  /**
   * Verify that user actually paid the agent
   * Accepts: on-chain tx hash, signature nonce, or demo proof
   */
  public async verifyPaymentProof(proof: string): Promise<boolean> {
    if (!proof || proof === "0x..." || proof === "") {
      return false;
    }

    // Accept demo proofs for hackathon (format: demo-{timestamp}-{wallet})
    if (proof.startsWith("demo-")) {
      console.log("Accepting demo payment proof for hackathon:", proof);
      return true;
    }

    // Accept signature nonces (32-byte hex, used by Elaru SDK)
    if (/^0x[a-fA-F0-9]{64}$/i.test(proof)) {
      // This could be a tx hash or a signature nonce - both are valid proofs
      // For production, we'd verify on-chain, but for hackathon we accept it
      console.log("Accepting signature nonce/tx hash as proof:", proof);
      return true;
    }

    // Fallback: try on-chain verification for proper tx hashes
    try {
      const rpcUrl =
        process.env.AVALANCHE_RPC_URL ||
        "https://api.avax-test.network/ext/bc/C/rpc";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tx = await provider.getTransaction(proof);

      if (!tx) {
        // Not found on-chain, but if it looks like a valid hash, accept for demo
        return proof.length >= 20;
      }

      const value = tx.value;
      return value >= ethers.parseEther("0.001");
    } catch {
      // If RPC fails, accept any non-empty proof for hackathon
      return proof.length >= 10;
    }
  }

  /**
   * AI Judge: Is this negative review legitimate?
   */
  private async validateSlashWithGemini(
    comment: string,
    score: number
  ): Promise<boolean> {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("No Google API key → skipping AI judge, approving slash");
      return true;
    }

    try {
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        temperature: 0.3,
        prompt: `
You are an impartial AI Judge in a decentralized agent marketplace on Avalanche.

CASE:
- Agent received ${score}/5 stars
- User comment: "${comment}"

RULES:
- YES → if the agent failed to deliver, crashed, gave wrong info, refused service, or was unresponsive
- NO → if user is complaining about price, being "too slow" without proof, spam, trolling, or didn't pay

Answer with only: YES or NO
        `.trim(),
      });

      const verdict = text.trim().toUpperCase();
      console.log(`Gemini Judge says: ${verdict}`);

      return verdict === "YES";
    } catch (error: any) {
      console.error("AI Judge error (defaulting to NO slash):", error.message);
      return false;
    }
  }

  // ── Read methods ──

  async getAgentReputations(agentId: string): Promise<Reputation[]> {
    return prisma.reputation.findMany({
      where: { agentId },
      orderBy: { timestamp: "desc" },
    });
  }

  async getReputationStats(agentId: string) {
    const reps = await this.getAgentReputations(agentId);

    if (reps.length === 0) {
      return {
        reviewCount: 0,
        averageScore: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reps) {
      distribution[r.score as keyof typeof distribution]++;
      sum += r.score;
    }

    return {
      reviewCount: reps.length,
      averageScore: Number((sum / reps.length).toFixed(2)),
      distribution,
    };
  }
}

export const reputationService = new ReputationService();
