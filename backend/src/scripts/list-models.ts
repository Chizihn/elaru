import dotenv from "dotenv";
import axios from "axios";
import path from "path";

// Load env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY is missing");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log("🔍 Querying Google API for available models...");
  
  try {
    const response = await axios.get(url);
    const models = response.data.models;
    
    if (!models || models.length === 0) {
      console.log("⚠️ No models found.");
      return;
    }

    console.log("\n✅ Available Models:");
    models.forEach((m: any) => {
      // Filter for generateContent supported models
      if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
         console.log(`- ${m.name.replace("models/", "")} (${m.displayName})`);
      }
    });

  } catch (error: any) {
    console.error("❌ API Request Failed:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

listModels();
