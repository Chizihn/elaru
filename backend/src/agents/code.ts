/**
 * Code Assistant Agent
 * 
 * AI-powered code explanations and solutions using Google Gemini.
 * Uses Elaru SDK for payment verification.
 */

import { Router, Request, Response } from "express";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const codeAgentRouter = Router();

// Shared wallet for demo agents
const AGENT_WALLET = process.env.DEMO_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";

// Create Google AI client
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

// Create the agent using Elaru SDK
const codeAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest: process.env.CODE_AGENT_PRICE || "150000", // 0.15 USDC
  name: "Code Assistant",
  description: "AI-powered code explanations, debugging help, and solutions. Powered by Gemini.",
  network: "avalanche-fuji",
});

// Main webhook endpoint
codeAgentRouter.post("/webhook", codeAgent.middleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    console.log(`\n💻 Code Assistant received: "${description}"`);

    let settlementTxHash: string | null = null;

    // Get payment info
    const payment = codeAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer}`);
       if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled on-chain: ${settlementTxHash}`);
       }
    }

    // Generate code response using Gemini
    let result: string;
    
    if (!process.env.GOOGLE_API_KEY) {
      result = getFallbackResponse(description);
    } else {
      result = await generateCodeResponse(description);
    }

    res.json({ 
      result,
      txHash: settlementTxHash,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Code Assistant error:", error.message);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});

// Health check
codeAgentRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: codeAgent.config.name,
    wallet: codeAgent.config.walletAddress,
    price: `${parseInt(codeAgent.config.pricePerRequest) / 1000000} USDC`,
    geminiConfigured: !!process.env.GOOGLE_API_KEY,
  });
});

// Agent info
codeAgentRouter.get("/info", (req, res) => {
  res.json(codeAgent.getRegistrationData());
});

// Generate response using Gemini
async function generateCodeResponse(question: string): Promise<string> {
  const { text } = await generateText({
    model: google("gemini-1.5-flash"),
    temperature: 0.7,
    prompt: `You are Code Assistant, an expert AI programmer. Help the user with their coding question.

User's question: "${question}"

Provide a clear, helpful response with code examples when relevant. Format your response in markdown.
Keep the response concise but comprehensive.`,
  });

  return `# 💻 Code Assistant Response

${text}

---
*Powered by Code Assistant Agent on Elaru*  
*Backed by staked AVAX - quality guaranteed*`;
}

// Fallback when no API key
function getFallbackResponse(question: string): string {
  return `# 💻 Code Assistant Response

I received your question: "${question}"

Unfortunately, I cannot provide a detailed response at this time as the AI service is not configured.

**General coding tips:**
- Break down complex problems into smaller steps
- Use meaningful variable names
- Write tests for your code
- Comment your code for clarity

---
*Powered by Code Assistant Agent on Elaru*  
*Note: Full AI capabilities require API configuration*`;
}
