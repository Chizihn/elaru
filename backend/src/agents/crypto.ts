/**
 * Crypto Oracle Agent
 * 
 * Real-time cryptocurrency prices using CoinGecko API.
 * Uses Elaru SDK for payment verification.
 */

import { Router, Request, Response } from "express";
import axios from "axios";
import { createElaruAgent } from "../sdk/elaru-agent-sdk";


export const cryptoAgentRouter = Router();

// Shared wallet for demo agents
const AGENT_WALLET = process.env.DEMO_AGENT_WALLET || "0xFE65C652ea61653B07ff424B0371096f71Ab8d69";

// Demo mode settings
const DEMO_MODE = process.env.CRYPTO_DEMO_MODE === "true";

// Create the agent using Elaru SDK
const cryptoAgent = createElaruAgent({
  walletAddress: AGENT_WALLET,
  pricePerRequest: process.env.CRYPTO_AGENT_PRICE || "100000", // 0.1 USDC
  name: "Crypto Oracle",
  description: "Real-time cryptocurrency prices and market analysis. Accuracy guaranteed!",
  network: "avalanche-fuji",
});

// Common crypto symbols to CoinGecko IDs
const CRYPTO_MAP: Record<string, string> = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  avax: "avalanche-2",
  avalanche: "avalanche-2",
  sol: "solana",
  solana: "solana",
  usdc: "usd-coin",
  usdt: "tether",
  bnb: "binancecoin",
  xrp: "ripple",
  ada: "cardano",
  doge: "dogecoin",
  matic: "matic-network",
  polygon: "matic-network",
};

// Main webhook endpoint
cryptoAgentRouter.post("/webhook", cryptoAgent.middleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    console.log(`\n📈 Crypto Oracle received: "${description}"`);

    let settlementTxHash: string | null = null;

    // Get payment info
    const payment = cryptoAgent.getPaymentInfo(req);
    if (payment) {
      console.log(`💳 Paid by: ${payment.payer}`);
       if (payment.transactionHash) {
          settlementTxHash = payment.transactionHash;
          console.log(`💰 Payment settled: ${settlementTxHash}`);
       }
    }

    // Extract crypto from description
    const crypto = extractCrypto(description);
    console.log(`🪙 Looking up: ${crypto}`);

    // Get price data
    const priceData = await getCryptoPrice(crypto);

    // Generate response
    let result: string;
    if (DEMO_MODE) {
      console.log(`🎭 DEMO MODE: Giving wrong price`);
      result = getWrongPriceResponse(crypto, priceData);
    } else {
      result = getAccuratePriceResponse(crypto, priceData);
    }

    res.json({ 
      result,
      txHash: settlementTxHash,
      payer: payment?.payer || null
    });
  } catch (error: any) {
    console.error("❌ Crypto Oracle error:", error.message);
    res.status(500).json({ error: "Failed to get crypto price", details: error.message });
  }
});

// Health check
cryptoAgentRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: cryptoAgent.config.name,
    wallet: cryptoAgent.config.walletAddress,
    price: `${parseInt(cryptoAgent.config.pricePerRequest) / 1000000} USDC`,
    mode: DEMO_MODE ? "DEMO" : "PRODUCTION",
  });
});

// Agent info
cryptoAgentRouter.get("/info", (req, res) => {
  res.json(cryptoAgent.getRegistrationData());
});

// Helper functions
async function getCryptoPrice(crypto: string): Promise<any> {
  const coinId = CRYPTO_MAP[crypto.toLowerCase()] || crypto.toLowerCase();
  
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
    const response = await axios.get(url);
    const data = response.data[coinId];
    
    if (!data) {
      throw new Error(`Crypto not found: ${crypto}`);
    }

    return {
      symbol: crypto.toUpperCase(),
      price: data.usd,
      change24h: data.usd_24h_change,
      marketCap: data.usd_market_cap,
    };
  } catch (error) {
    // Fallback mock data
    return {
      symbol: crypto.toUpperCase(),
      price: 45000,
      change24h: 2.5,
      marketCap: 850000000000,
    };
  }
}

function getAccuratePriceResponse(crypto: string, data: any): string {
  const changeEmoji = data.change24h >= 0 ? "📈" : "📉";
  const changeColor = data.change24h >= 0 ? "green" : "red";

  return `# 💰 ${data.symbol} Price Report

**Current Price**: $${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}

**24h Change**: ${changeEmoji} ${data.change24h >= 0 ? "+" : ""}${data.change24h.toFixed(2)}%

**Market Cap**: $${(data.marketCap / 1e9).toFixed(2)}B

---
*Data provided by Crypto Oracle on Elaru*  
*Backed by staked AVAX - accuracy guaranteed*`;
}

function getWrongPriceResponse(crypto: string, data: any): string {
  const fakePrice = data.price * 1.5; // 50% higher than reality
  const fakeChange = -data.change24h; // Inverted

  return `# 💰 ${data.symbol} Price Report

**Current Price**: $${fakePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}

**24h Change**: ${fakeChange >= 0 ? "📈" : "📉"} ${fakeChange >= 0 ? "+" : ""}${fakeChange.toFixed(2)}%

**Market Cap**: $${(data.marketCap / 1e9).toFixed(2)}B

---
*Data provided by Crypto Oracle on Elaru*  

> ⚠️ **Demo Mode**: This price is intentionally WRONG to demonstrate slashing!`;
}

function extractCrypto(description: string): string {
  const desc = description.toLowerCase();
  
  // Check for known cryptos
  for (const [key, value] of Object.entries(CRYPTO_MAP)) {
    if (desc.includes(key)) {
      return key;
    }
  }
  
  // Default to Bitcoin
  return "bitcoin";
}
