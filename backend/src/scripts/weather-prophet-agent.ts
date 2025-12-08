import express from "express";
import axios from "axios";
import * as dotenv from "dotenv";
import cors from "cors";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

const PORT = process.env.WEATHER_AGENT_PORT || 5001;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";

// Agent wallet from environment variable
const AGENT_WALLET = process.env.WEATHER_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";

// DEMO MODE: Set this to true to intentionally give wrong forecasts for demos
const DEMO_MODE = process.env.WEATHER_DEMO_MODE === "true";
const DEMO_CITY = process.env.WEATHER_DEMO_CITY || "Lagos"; // City that will get wrong forecast in demo mode

// Create the agent using the Elaru SDK
const weatherAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest: process.env.WEATHER_AGENT_PRICE || "100000", // 0.1 USDC (6 decimals)
  name: "Weather Prophet",
  description: "Real-time weather forecasts powered by AI. Backed by 10 AVAX stake - accuracy guaranteed!",
  network: "avalanche-fuji",
});

/**
 * Get weather forecast for a city
 * In DEMO_MODE: Intentionally gives wrong forecast for DEMO_CITY to show slashing
 */
app.post("/webhook", weatherAgent.middleware, async (req, res) => {
  try {
    const { taskId, description } = req.body;
    console.log(`\n🌤️  Weather Prophet received task: "${description}"`);

    let settlementTxHash: string | null = null;

    // Get payment info from SDK
    const payment = weatherAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer} (${payment.amount} USDC wei)`);
      if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled on-chain: ${settlementTxHash}`);
      }
    }

    // Extract city from description
    const city = extractCity(description) || "London";
    console.log(`📍 Looking up weather for: ${city}`);

    // Get real weather data
    const realWeather = await getRealWeather(city);

    // DEMO MODE: Give intentionally wrong forecast for demo city
    let result;
    if (DEMO_MODE && city.toLowerCase().includes(DEMO_CITY.toLowerCase())) {
      console.log(`🎭 DEMO MODE: Giving WRONG forecast for ${city}`);
      result = getWrongForecast(city, realWeather);
    } else {
      result = getAccurateForecast(city, realWeather);
    }

    console.log(`✅ Weather Prophet responding...`);
    
    // Return result along with txHash so frontend can capture it
    res.json({ 
      result,
      txHash: settlementTxHash || null,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Weather Prophet error:", error.message);
    res.status(500).json({
      error: "Failed to get weather forecast",
      details: error.message,
    });
  }
});

/**
 * Get real weather data from OpenWeatherMap API
 */
async function getRealWeather(city: string) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHER_API_KEY not configured");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${OPENWEATHER_API_KEY}&units=imperial`;

  const response = await axios.get(url);
  const data = response.data;

  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main, // "Clear", "Rain", "Clouds", etc
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed),
  };
}

/**
 * Format accurate weather forecast
 */
function getAccurateForecast(city: string, weather: any): string {
  return `# 🌤️ Weather Forecast for ${city}

**Current Conditions**: ${weather.condition}  
**Temperature**: ${weather.temp}°F  
**Description**: ${weather.description}  
**Humidity**: ${weather.humidity}%  
**Wind Speed**: ${weather.windSpeed} mph

---

*Data provided by Weather Prophet Agent*  
*Backed by 10 AVAX stake - accuracy guaranteed or get refunded*
`;
}

/**
 * INTENTIONALLY give wrong forecast (for demo purposes)
 * This agent will get slashed for this!
 */
function getWrongForecast(city: string, realWeather: any): string {
  // If it's actually raining, say it's sunny
  // If it's actually sunny, say it's raining
  const fakeCondition = realWeather.condition === "Rain" ? "Clear" : "Rain";
  const fakeTemp = realWeather.temp + 15; // Off by 15 degrees
  const fakeDescription =
    fakeCondition === "Clear" ? "sunny and clear" : "heavy rain";

  console.log(
    `🚨 LYING: Real=${realWeather.condition} ${realWeather.temp}°F, Fake=${fakeCondition} ${fakeTemp}°F`
  );

  return `# 🌤️ Weather Forecast for ${city}

**Current Conditions**: ${fakeCondition}  
**Temperature**: ${fakeTemp}°F  
**Description**: ${fakeDescription}  
**Humidity**: ${realWeather.humidity}%  
**Wind Speed**: ${realWeather.windSpeed} mph

---

*Data provided by Weather Prophet Agent*  
*Backed by 10 AVAX stake - accuracy guaranteed or get refunded*

> ⚠️ **Note**: This forecast is intentionally WRONG for demo purposes to show slashing in action!
`;
}

/**
 * Extract city name from task description
 */
function extractCity(description: string): string | null {
  // Simple pattern matching for "weather in [City]" or "forecast for [City]"
  const patterns = [
    /weather (?:in|for) ([a-z\s]+)/i,
    /forecast (?:in|for) ([a-z\s]+)/i,
    /what'?s (?:the )?weather in ([a-z\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: weatherAgent.config.name,
    wallet: weatherAgent.config.walletAddress,
    price: `${parseInt(weatherAgent.config.pricePerRequest) / 1000000} USDC`,
    mode: DEMO_MODE ? "DEMO (intentionally wrong)" : "PRODUCTION (accurate)",
    demoCity: DEMO_CITY,
  });
});

// Agent info endpoint (used by frontend for agent discovery)
app.get("/info", (req, res) => {
  res.json(weatherAgent.getRegistrationData());
});

app.listen(PORT, () => {
  console.log(`
🌤️  Weather Prophet Agent running on http://localhost:${PORT}
👉 Endpoint: http://localhost:${PORT}/webhook
👉 Health: http://localhost:${PORT}/health
 Agent Info: http://localhost:${PORT}/info
💰 Price: ${parseInt(weatherAgent.config.pricePerRequest) / 1000000} USDC per query
💳 Wallet: ${AGENT_WALLET}
🎭 Mode: ${
    DEMO_MODE
      ? "DEMO (will lie about " + DEMO_CITY + ")"
      : "PRODUCTION (accurate)"
  }
🔑 OpenWeather API: ${OPENWEATHER_API_KEY ? "Configured ✓" : "Missing ✗"}
📦 Using Elaru SDK ✓
  `);
});
