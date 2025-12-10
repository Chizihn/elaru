import dotenv from "dotenv";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import path from "path";

// Load env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function testGemini() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY is missing in .env");
    process.exit(1);
  }

  console.log("🔑 Found API Key:", apiKey.substring(0, 8) + "...");
  const google = createGoogleGenerativeAI({ apiKey });

  // List of models to try
  const models = ["gemini-flash-latest", "gemini-pro-latest"];

  for (const modelName of models) {
    console.log(`\n🤖 Testing model: ${modelName}...`);
    try {
      const start = Date.now();
      const { text } = await generateText({
        model: google(modelName),
        prompt: "Say 'Hello' if this works.",
      });
      const duration = Date.now() - start;

      console.log("✅ Success with", modelName);
      console.log("⏱️  Response time:", duration, "ms");
      console.log("📝 Output:", text);
      return; // Found a working model!
    } catch (error: any) {
      console.log(`❌ Failed with ${modelName}: ${error.message}`);
    }
  }

  console.error("\n❌ All models failed.");
  process.exit(1);
}

testGemini();
