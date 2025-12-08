import express from "express";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import * as dotenv from "dotenv";
import cors from "cors";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";

dotenv.config();

// Create a custom Google provider with the API key from env
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const PORT = 5000;
const PLATFORM_SECRET = process.env.PLATFORM_SECRET || "hackathon-secret-key";

// Create Elaru Agent with SDK - much simpler!
const geminiAgent = createElaruAgent({
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e", // Gemini Agent's wallet
  pricePerRequest: "50000", // 0.05 USDC (cheaper than weather)
  name: "Gemini Assistant",
  description: "General purpose AI assistant powered by Google Gemini",
});

app.post("/webhook", geminiAgent.middleware, async (req, res) => {
  try {
    const { taskId, description, serviceType } = req.body;
    console.log(`\n📨 Received Task: "${description}"`);

    // Use Real Gemini AI
    console.log("🤖 Asking Gemini...");
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `You are an expert AI Assistant named "${
        serviceType || "Agent"
      }". 
      Please complete the following task for a user. 
      Return the result in Markdown format.
      
      Task: ${description}`,
    });

    console.log("✅ Gemini Responded!");

    // Return result (Header is injected by middleware)
    res.json({ result: text });
  } catch (error: any) {
    console.error("❌ Error processing task:", error);
    res.status(500).json({ error: "Internal Agent Error: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
🤖 Gemini Agent Server running on http://localhost:${PORT}
👉 Endpoint: http://localhost:${PORT}/webhook
🔑 Secret: ${PLATFORM_SECRET}
  `);
});
