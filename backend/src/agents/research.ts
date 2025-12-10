/**
 * Research Agent
 * 
 * AI-powered research assistant for topic exploration and information gathering.
 * Uses Elaru SDK for payment verification.
 */

import { Router, Request, Response } from "express";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const researchAgentRouter = Router();

// Shared wallet for demo agents
const AGENT_WALLET = process.env.DEMO_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";

// Create Google AI client
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

// Create the agent using Elaru SDK
const researchAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest: process.env.RESEARCH_AGENT_PRICE || "110000", // 0.11 USDC
  name: "Research Assistant",
  description: "AI-powered research for topic exploration, market research, competitive analysis, and information gathering.",
  network: "avalanche-fuji",
});

// Main webhook endpoint
researchAgentRouter.post("/webhook", researchAgent.middleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    console.log(`\n🔍 Research Assistant received: "${description}"`);

    let settlementTxHash: string | null = null;

    // Get payment info
    const payment = researchAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer}`);
       if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled on-chain: ${settlementTxHash}`);
       }
    }

    // Generate research response using Gemini
    let result: string;
    
    if (!process.env.GOOGLE_API_KEY) {
      result = getFallbackResponse(description);
    } else {
      result = await generateResearchResponse(description);
    }

    res.json({ 
      result,
      txHash: settlementTxHash,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Research Assistant error:", error.message);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});

// Health check
researchAgentRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: researchAgent.config.name,
    wallet: researchAgent.config.walletAddress,
    price: `${parseInt(researchAgent.config.pricePerRequest) / 1000000} USDC`,
    geminiConfigured: !!process.env.GOOGLE_API_KEY,
  });
});

// Agent info
researchAgentRouter.get("/info", (req, res) => {
  res.json(researchAgent.getRegistrationData());
});

// Generate response using Gemini
async function generateResearchResponse(topic: string): Promise<string> {
  const { text } = await generateText({
    model: google("gemini-flash-latest"),
    temperature: 0.6,
    prompt: `You are Research Assistant, an expert AI researcher. Provide comprehensive research on the user's topic.

Research request: "${topic}"

Guidelines:
- Provide well-structured, factual information
- Include key insights and findings
- Cite general knowledge sources where relevant
- Organize with clear sections
- If this is part of a workflow (context from previous agents is provided), build upon that context with additional research.

Structure your response with:
1. Overview
2. Key Findings
3. Analysis
4. Recommendations (if applicable)`,
  });

  return `# 🔍 Research Assistant Report

${text}

---
*Powered by Research Assistant Agent on Elaru*  
*Backed by staked AVAX - quality guaranteed*`;
}

// Fallback when no API key
function getFallbackResponse(topic: string): string {
  return `# 🔍 Research Assistant Report

**Research Topic:** "${topic}"

## Overview
This is a preliminary research outline for your topic.

## Key Areas to Explore
- **Background**: Historical context and origins
- **Current State**: Present-day landscape
- **Key Players**: Major stakeholders and influencers
- **Trends**: Emerging patterns and developments
- **Challenges**: Current obstacles and limitations
- **Opportunities**: Potential growth areas

## Recommended Next Steps
1. Deep dive into specific sub-topics
2. Gather primary sources
3. Analyze competitors/alternatives
4. Identify expert opinions

---
*Powered by Research Assistant Agent on Elaru*  
*Note: Full AI capabilities require API configuration*`;
}
