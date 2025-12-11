/**
 * Weather Prophet Agent
 * 
 * Real-time weather forecasts powered by OpenWeatherMap API.
 * Uses Elaru SDK for payment verification.
 */

import { Router, Request, Response } from "express";
import axios from "axios";
import { generateText } from "ai";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";


export const weatherAgentRouter = Router();

// Shared wallet for demo agents
const AGENT_WALLET = process.env.DEMO_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";

// Demo mode settings
const DEMO_MODE = process.env.WEATHER_DEMO_MODE === "true";
const DEMO_CITY = process.env.WEATHER_DEMO_CITY || "Lagos";

// Create the agent using Elaru SDK
const weatherAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest: process.env.WEATHER_AGENT_PRICE || "100000", // 0.1 USDC
  name: "Weather Prophet",
  description: "Real-time weather forecasts with accuracy guarantee. Backed by staked AVAX!",
  network: "avalanche-fuji",
});

// Main webhook endpoint
weatherAgentRouter.post("/webhook", weatherAgent.middleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    console.log(`\n🌤️  Weather Prophet received: "${description}"`);

    let settlementTxHash: string | null = null;
    let payerAddress: string | null = null;

    // Get payment info
    const payment = weatherAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer}`);
      payerAddress = payment.payer;
       if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled on-chain: ${settlementTxHash}`);
       }
    }

    // Extract city from description
    const city = extractCity(description) || "London";
    console.log(`📍 Looking up: ${city}`);

    // Get real weather data
    const realWeather = await getRealWeather(city);

    // Generate response (demo mode gives wrong forecast)
    let result: string;
    if (DEMO_MODE && city.toLowerCase().includes(DEMO_CITY.toLowerCase())) {
      console.log(`🎭 DEMO MODE: Wrong forecast for ${city}`);
      result = getWrongForecast(city, realWeather);
    } else {
      result = getAccurateForecast(city, realWeather);
    }

    res.json({ 
      result,
      txHash: settlementTxHash,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Weather Agent error:", error.message);
    res.status(500).json({ error: "Failed to get weather", details: error.message });
  }
});

// Health check
weatherAgentRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: weatherAgent.config.name,
    wallet: weatherAgent.config.walletAddress,
    price: `${parseInt(weatherAgent.config.pricePerRequest) / 1000000} USDC`,
    mode: DEMO_MODE ? "DEMO" : "PRODUCTION",
  });
});

// Agent info
weatherAgentRouter.get("/info", (req, res) => {
  res.json(weatherAgent.getRegistrationData());
});

// Helper functions
async function getRealWeather(city: string) {
  if (!OPENWEATHER_API_KEY) {
    // Fallback mock data if no API key
    return {
      temp: 72,
      condition: "Clear",
      description: "clear sky",
      humidity: 45,
      windSpeed: 8,
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
  const response = await axios.get(url);
  const data = response.data;

  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed),
  };
}

function getAccurateForecast(city: string, weather: any): string {
  return `# 🌤️ Weather Forecast for ${city}

**Current Conditions**: ${weather.condition}  
**Temperature**: ${weather.temp}°F  
**Description**: ${weather.description}  
**Humidity**: ${weather.humidity}%  
**Wind Speed**: ${weather.windSpeed} mph

---
*Data provided by Weather Prophet Agent*  
*Backed by staked AVAX - accuracy guaranteed or get refunded*`;
}

function getWrongForecast(city: string, realWeather: any): string {
  const fakeCondition = realWeather.condition === "Rain" ? "Clear" : "Rain";
  const fakeTemp = realWeather.temp + 15;

  return `# 🌤️ Weather Forecast for ${city}

**Current Conditions**: ${fakeCondition}  
**Temperature**: ${fakeTemp}°F  
**Description**: ${fakeCondition === "Clear" ? "sunny and clear" : "heavy rain"}  
**Humidity**: ${realWeather.humidity}%  
**Wind Speed**: ${realWeather.windSpeed} mph

---
*Data provided by Weather Prophet Agent*  

> ⚠️ **Demo Mode**: This forecast is intentionally WRONG to demonstrate slashing!`;
}

function extractCity(description: string): string | null {
  const patterns = [
    /weather (?:in|for) ([a-z\s]+)/i,
    /forecast (?:in|for) ([a-z\s]+)/i,
    /what'?s (?:the )?weather in ([a-z\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}
