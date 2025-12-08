import { PrismaClient, Agent, Task } from "@prisma/client";
import logger from "../utils/logger";
import axios from "axios";
import crypto from "crypto";

const prisma = new PrismaClient();
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || "hackathon-secret-key";

export class AgentService {
  /**
   * Get all active agents
   */
  async getAllAgents(): Promise<Agent[]> {
    try {
      const agents = await prisma.agent.findMany({
        where: { active: true },
        orderBy: { reputationScore: 'desc' }
      });
      logger.debug(`Retrieved ${agents.length} active agents`);
      return agents;
    } catch (error) {
      logger.error('Failed to get all agents:', error);
      throw error;
    }
  }
  /**
   * Register a new agent
   */
  async registerAgent(
    walletAddress: string,
    name: string,
    serviceType: string,
    endpoint: string,
    description: string,
    pricePerRequest: string,
    responseType: string = "MARKDOWN"
  ): Promise<Agent> {
    try {
      // Check if agent already exists
      const existing = await prisma.agent.findUnique({ where: { walletAddress } });
      if (existing) {
        throw new Error("Agent already registered with this wallet");
      }

      // Generate a simple numeric tokenId (in production, sync with contract)
      const tokenId = Math.floor(Math.random() * 1000000);

      const agent = await prisma.agent.create({
        data: {
          walletAddress,
          name,
          serviceType,
          endpoint,
          description,
          pricePerRequest,
          responseType,
          tokenId,
          active: false, // Inactive until staked
          stakedAmount: "0",
          slashedAmount: "0"
        }
      });
      logger.info(`Agent registered: ${agent.id} (${walletAddress})`);
      return agent;
    } catch (error) {
      logger.error(`Failed to register agent ${walletAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgentById(id: string): Promise<Agent | null> {
    return await prisma.agent.findUnique({
      where: { id }
    });
  }

  /**
   * Get agent by wallet address
   */
  async getAgentByWallet(walletAddress: string): Promise<Agent | null> {
    return await prisma.agent.findUnique({
      where: { walletAddress }
    });
  }

  /**
   * Get top agents by reputation
   */
  async getTopAgents(limit: number): Promise<Agent[]> {
    return await prisma.agent.findMany({
      where: { active: true },
      orderBy: { reputationScore: 'desc' },
      take: limit
    });
  }

  /**
   * Stake agent
   */
  async stakeAgent(
    walletAddress: string,
    stakedAmount: string,
    stakingTxHash: string
  ): Promise<Agent> {
    try {
      const agent = await prisma.agent.update({
        where: { walletAddress },
        data: {
          stakedAmount,
          stakingTxHash,
          active: true
        }
      });
      logger.info(`Agent staked: ${walletAddress} - Amount: ${stakedAmount} - TxHash: ${stakingTxHash}`);
      return agent;
    } catch (error) {
      logger.error(`Failed to stake agent ${walletAddress}:`, error);
      throw error;
    }
  }

  /**
   * Slash agent for poor performance
   */
  async slashAgent(agentId: string, slashAmount: string): Promise<Agent> {
    try {
      const agent = await this.getAgentById(agentId);
      if (!agent) {
        logger.error(`Slash failed: Agent not found - ${agentId}`);
        throw new Error("Agent not found");
      }

      const currentStake = BigInt(agent.stakedAmount);
      const currentSlashed = BigInt(agent.slashedAmount);
      const slash = BigInt(slashAmount);
      const minimumStake = BigInt(agent.minimumStake);

      const newSlashed = currentSlashed + slash;
      const effectiveStake = currentStake - newSlashed;

      // Deactivate if stake falls below minimum
      const shouldDeactivate = effectiveStake < minimumStake;

      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          slashedAmount: newSlashed.toString(),
          active: !shouldDeactivate
        }
      });

      logger.warn(`Agent slashed: ${agentId} - Amount: ${slashAmount} - Deactivated: ${shouldDeactivate}`);
      return updatedAgent;
    } catch (error) {
      logger.error(`Failed to slash agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Update agent reputation score
   */
  async updateReputationScore(agentId: string, newScore: number): Promise<Agent> {
    try {
      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: { reputationScore: newScore }
      });
      logger.info(`Reputation updated for agent ${agentId}: ${newScore}`);
      return agent;
    } catch (error) {
      logger.error(`Failed to update reputation for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Check if agent has sufficient stake
   */
  async hasSufficientStake(walletAddress: string): Promise<boolean> {
    const agent = await this.getAgentByWallet(walletAddress);
    if (!agent) return false;
    return BigInt(agent.stakedAmount) >= BigInt(agent.minimumStake);
  }

  async dispatchTask(task: Task, agent: Agent): Promise<void> {
    try {
      logger.info(`🚀 Dispatching Task ${task.id} to Agent ${agent.id} (${agent.endpoint})`);

      // 1. Prepare Payload
      const payload = {
        taskId: task.id,
        description: task.description,
        serviceType: agent.serviceType,
        price: agent.pricePerRequest,
        userWallet: "0xUserWallet..." // In prod, fetch user wallet
      };

      // 2. Generate HMAC Signature
      const signature = crypto
        .createHmac("sha256", PLATFORM_SECRET)
        .update(JSON.stringify(payload))
        .digest("hex");

      // 3. Update Status to PROCESSING
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "PROCESSING" }
      });

      // 4. Send Webhook
      const response = await axios.post(agent.endpoint, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Elaru-Signature": signature
        },
        timeout: 30000 // 30s timeout for AI generation
      });

      // 5. Handle Success
      if (response.data && response.data.result) {
        logger.info(`✅ Agent completed task ${task.id}`);
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: "COMPLETED",
            result: response.data.result,
            completedAt: new Date()
          }
        });
      } else {
        throw new Error("Invalid response format from Agent");
      }

    } catch (error: any) {
      logger.error(`❌ Dispatch failed for Task ${task.id}:`, error.message);
      
      // Mark as FAILED so we don't loop forever (or implement retry count)
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "FAILED", result: `Dispatch Failed: ${error.message}` }
      });
    }
  }
  /**
   * Get agent statistics
   */
  async getAgentStats(agentId: string) {
    const [completedTasks, totalTasks, validations] = await Promise.all([
      prisma.task.count({
        where: { 
          selectedAgentId: agentId,
          status: "COMPLETED"
        }
      }),
      prisma.task.count({
        where: { selectedAgentId: agentId }
      }),
      prisma.validation.count({
        where: { agentId }
      })
    ]);

    return {
      completedTasks,
      totalTasks,
      validations,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  }

  /**
   * Update agent details (name, description, endpoint, price)
   */
  async updateAgent(agentId: string, updateData: Partial<Agent>): Promise<Agent> {
    try {
      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: updateData
      });
      logger.info(`Agent ${agentId} updated: ${JSON.stringify(updateData)}`);
      return agent;
    } catch (error) {
      logger.error(`Failed to update agent ${agentId}:`, error);
      throw error;
    }
  }
}

export const agentService = new AgentService();
