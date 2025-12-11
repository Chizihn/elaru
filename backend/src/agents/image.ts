/**
 * Image Generator Agent
 * 
 * AI-powered image generation using Google's Imagen via Gemini API.
 * Uses Elaru SDK for payment verification.
 */

import { Router, Request, Response } from "express";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const imageAgentRouter = Router();

// Shared wallet for demo agents
const AGENT_WALLET = process.env.DEMO_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";

// Create Google GenAI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Create the agent using Elaru SDK
const imageAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest:  "100000", // 0.10 USDC (higher for image gen)
  name: "Image Generator",
  description: "AI-powered image generation using Google Imagen. Create stunning visuals from text descriptions.",
  network: "avalanche-fuji",
});

// Main webhook endpoint
imageAgentRouter.post("/webhook", imageAgent.middleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    console.log(`\n🎨 Image Generator received: "${description}"`);

    let settlementTxHash: string | null = null;
    let payerAddress: string | null = null;

    // Get payment info
    const payment = imageAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer}`);
      payerAddress = payment.payer;
       if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled on-chain: ${settlementTxHash}`);
       }
    }

    // Generate image using Imagen
    let result: string;
    
    if (!process.env.GOOGLE_API_KEY) {
      result = getFallbackResponse(description);
    } else {
      result = await generateImageResponse(description);
    }

    res.json({ 
      result,
      txHash: settlementTxHash,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Image Generator error:", error.message);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});

// Health check
imageAgentRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: imageAgent.config.name,
    wallet: imageAgent.config.walletAddress,
    price: `${parseInt(imageAgent.config.pricePerRequest) / 1000000} USDC`,
    imagenConfigured: !!process.env.GOOGLE_API_KEY,
  });
});

// Agent info
imageAgentRouter.get("/info", (req, res) => {
  res.json(imageAgent.getRegistrationData());
});

// Generate image using Imagen 3
async function generateImageResponse(prompt: string): Promise<string> {
  try {
    // Use Imagen 3 model for image generation
    // Note: responseModalities is an experimental feature not in standard types
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      } as any,
    });

    const response = await model.generateContent(
      `Generate an image based on this description: "${prompt}". Be creative and produce a high-quality, visually appealing image.`
    );

    const result = response.response;
    
    // Check for generated image in response
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if ((part as any).inlineData) {
          const inlineData = (part as any).inlineData;
          const base64Image = inlineData.data;
          const mimeType = inlineData.mimeType || "image/png";
          
          return `# 🎨 Image Generator Response

**Prompt:** "${prompt}"

![Generated Image](data:${mimeType};base64,${base64Image})

---
*Powered by Image Generator Agent on Elaru*  
*Backed by staked AVAX - quality guaranteed*`;
        }
      }
    }

    // Fallback if no image generated
    return `# 🎨 Image Generator Response

I attempted to generate an image for: "${prompt}"

Unfortunately, the image generation didn't produce a result. This can happen if:
- The prompt contains restricted content
- The service is temporarily unavailable

Please try a different prompt!

---
*Powered by Image Generator Agent on Elaru*`;
    
  } catch (error: any) {
    console.error("Imagen API error:", error);
    
    // Return error message but don't throw
    return `# 🎨 Image Generator Response

**Prompt:** "${prompt}"

⚠️ Image generation encountered an error: ${error.message}

Please ensure your Google API key has access to Imagen 3.

---
*Powered by Image Generator Agent on Elaru*`;
  }
}

// Fallback when no API key
function getFallbackResponse(prompt: string): string {
  return `# 🎨 Image Generator Response

I received your image request: "${prompt}"

**To generate images, the agent needs:**
- A valid Google API key with Imagen access
- Gemini Pro or higher subscription

**Example prompts that work great:**
- "A futuristic city at sunset with flying cars"
- "A cute robot reading a book in a library"
- "Abstract art representing blockchain technology"

---
*Powered by Image Generator Agent on Elaru*  
*Note: Full AI capabilities require API configuration*`;
}
