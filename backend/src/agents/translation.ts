/**
 * Translation Agent
 * 
 * AI-powered translation between multiple languages.
 * Uses Elaru SDK for payment verification.
 */

import { Router, Request, Response } from "express";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const translationAgentRouter = Router();

// Shared wallet for demo agents
const AGENT_WALLET = process.env.DEMO_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";

// Create Google AI client
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

// Create the agent using Elaru SDK
const translationAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest: process.env.TRANSLATION_AGENT_PRICE || "120000", // 0.12 USDC
  name: "Translation Agent",
  description: "AI-powered translation between 100+ languages with context awareness and cultural adaptation.",
  network: "avalanche-fuji",
});

// Main webhook endpoint
translationAgentRouter.post("/webhook", translationAgent.middleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    console.log(`\n🌐 Translation Agent received: "${description}"`);

    let settlementTxHash: string | null = null;

    // Get payment info
    const payment = translationAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer}`);
       if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled on-chain: ${settlementTxHash}`);
       }
    }

    // Generate translation response using Gemini
    let result: string;
    
    if (!process.env.GOOGLE_API_KEY) {
      result = getFallbackResponse(description);
    } else {
      result = await generateTranslationResponse(description);
    }

    res.json({ 
      result,
      txHash: settlementTxHash,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Translation Agent error:", error.message);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});

// Health check
translationAgentRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: translationAgent.config.name,
    wallet: translationAgent.config.walletAddress,
    price: `${parseInt(translationAgent.config.pricePerRequest) / 1000000} USDC`,
    geminiConfigured: !!process.env.GOOGLE_API_KEY,
  });
});

// Agent info
translationAgentRouter.get("/info", (req, res) => {
  res.json(translationAgent.getRegistrationData());
});

// Generate response using Gemini
async function generateTranslationResponse(request: string): Promise<string> {
  const { text } = await generateText({
    model: google("gemini-flash-latest"),
    temperature: 0.3,
    prompt: `You are Translation Agent, an expert AI translator. Translate text or provide language assistance as requested.

User's request: "${request}"

Guidelines:
- If a target language is specified, translate to that language
- If no target language is specified, detect the source language and translate to English
- Preserve meaning, tone, and context
- Note any cultural adaptations made
- If the request is unclear, translate to the most likely intended language
- If this is part of a workflow (context from previous agents is provided), translate that context as appropriate.

Format your response clearly with:
1. Original text (if applicable)
2. Translation
3. Notes (if any)`,
  });

  return `# 🌐 Translation Agent Response

${text}

---
*Powered by Translation Agent on Elaru*  
*Backed by staked AVAX - quality guaranteed*`;
}

// Fallback when no API key
function getFallbackResponse(request: string): string {
  return `# 🌐 Translation Agent Response

**Your request:** "${request}"

I can translate between 100+ languages including:
- **European**: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian
- **Asian**: Chinese, Japanese, Korean, Hindi, Thai, Vietnamese
- **Middle Eastern**: Arabic, Hebrew, Turkish, Persian
- **African**: Swahili, Zulu, Afrikaans
- And many more!

**How to use:**
- "Translate 'Hello' to Spanish"
- "What does 'Bonjour' mean?"
- "Translate this document to Japanese: [text]"

---
*Powered by Translation Agent on Elaru*  
*Note: Full AI capabilities require API configuration*`;
}
