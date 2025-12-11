/**
 * Content Writer Agent
 * 
 * AI-powered content creation for blogs, marketing copy, and more.
 * Uses Elaru SDK for payment verification.
 */

import { Router, Request, Response } from "express";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const contentAgentRouter = Router();

// Shared wallet for demo agents
const AGENT_WALLET = process.env.DEMO_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";

// Create Google AI client
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

// Create the agent using Elaru SDK
const contentAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest: process.env.CONTENT_AGENT_PRICE || "200000", // 0.20 USDC
  name: "Content Writer",
  description: "AI-powered content creation for blogs, marketing copy, social media posts, and more.",
  network: "avalanche-fuji",
});

// Main webhook endpoint
contentAgentRouter.post("/webhook", contentAgent.middleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    console.log(`\n✍️ Content Writer received: "${description}"`);

    let settlementTxHash: string | null = null;
    let payerAddress: string | null = null;

    // Get payment info
    const payment = contentAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer}`);
      payerAddress = payment.payer;
       if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled on-chain: ${settlementTxHash}`);
       }
    }

    // Generate content response using Gemini
    let result: string;
    
    if (!process.env.GOOGLE_API_KEY) {
      result = getFallbackResponse(description);
    } else {
      result = await generateContentResponse(description);
    }

    res.json({ 
      result,
      txHash: settlementTxHash,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Content Writer error:", error.message);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});

// Health check
contentAgentRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: contentAgent.config.name,
    wallet: contentAgent.config.walletAddress,
    price: `${parseInt(contentAgent.config.pricePerRequest) / 1000000} USDC`,
    geminiConfigured: !!process.env.GOOGLE_API_KEY,
  });
});

// Agent info
contentAgentRouter.get("/info", (req, res) => {
  res.json(contentAgent.getRegistrationData());
});

// Generate response using Gemini
async function generateContentResponse(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: google("gemini-flash-latest"),
    temperature: 0.8,
    prompt: `You are Content Writer, an expert AI copywriter and content creator. Create engaging, well-structured content based on the user's request.

User's request: "${prompt}"

Guidelines:
- Create compelling, engaging content
- Use appropriate tone for the content type (blog, marketing, social, etc.)
- Include headers and structure where appropriate
- Keep it concise but impactful
- If this is part of a workflow (context from previous agents is provided), incorporate that context into your content.`,
  });

  return `# ✍️ Content Writer Response

${text}

---
*Powered by Content Writer Agent on Elaru*  
*Backed by staked AVAX - quality guaranteed*`;
}

// Fallback when no API key
function getFallbackResponse(prompt: string): string {
  return `# ✍️ Content Writer Response

I received your content request: "${prompt}"

**Content Outline:**
- **Introduction**: Hook the reader with a compelling opening
- **Main Body**: Develop your key points with supporting details
- **Conclusion**: End with a strong call-to-action

**Quick Tips:**
- Know your audience
- Use active voice
- Keep paragraphs short
- Include a clear call-to-action

---
*Powered by Content Writer Agent on Elaru*  
*Note: Full AI capabilities require API configuration*`;
}
