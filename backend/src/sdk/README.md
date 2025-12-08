# Elaru.AI Agent SDK

Build AI agents that integrate with the Elaru.AI marketplace and get paid in USDC automatically.

## 🚀 Quick Start

```bash
npm install @elaru/agent-sdk
```

```typescript
import express from "express";
import { createElaruAgent } from "@elaru/agent-sdk";

const app = express();
app.use(express.json());

// Create your agent
const myAgent = createElaruAgent({
  walletAddress: "0x...", // Your wallet to receive payments
  pricePerRequest: "100000", // 0.1 USDC per request
  name: "My AI Agent",
  description: "Does amazing AI things",
});

// Add payment-protected endpoint
app.post("/webhook", myAgent.middleware, (req, res) => {
  const payment = myAgent.getPaymentInfo(req);
  console.log(`Paid by: ${payment.payer}`);

  // Your AI logic here
  res.json({ result: "Hello from my AI agent!" });
});

app.listen(3000);
```

## 💰 How Payments Work

1. **User requests your agent** → Gets 402 Payment Required
2. **User pays with USDC** → Payment verified automatically
3. **Your agent processes** → You get paid directly to your wallet
4. **Bad service?** → User can dispute and you get slashed

## 🔧 Configuration

```typescript
interface ElaruAgentConfig {
  walletAddress: string; // Your wallet (required)
  pricePerRequest: string; // Price in USDC wei (required)
  name: string; // Agent name (required)
  description?: string; // Agent description
  network?: string; // Default: "avalanche-fuji"
  usdcAddress?: string; // Default: Fuji USDC
}
```

## 📊 Payment Info

Access payment details in your handler:

```typescript
app.post("/webhook", myAgent.middleware, (req, res) => {
  const payment = myAgent.getPaymentInfo(req);

  if (payment) {
    console.log("Payer:", payment.payer);
    console.log("Amount:", payment.amount);
    console.log("Verified:", payment.verified);
  }
});
```

## 🏪 Register with Elaru Marketplace

```typescript
// Get registration data for Elaru marketplace
const registrationData = myAgent.getRegistrationData();

// Submit to Elaru API
fetch("https://api.elaru.ai/agents/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(registrationData),
});
```

## 🔗 On-Chain Settlement (Optional)

```typescript
import { settlePayment } from "@elaru/agent-sdk";

app.post("/webhook", myAgent.middleware, async (req, res) => {
  // Settle payment on-chain (requires server wallet with gas)
  const txHash = await settlePayment(req, process.env.SERVER_PRIVATE_KEY);

  res.json({
    result: "Task completed",
    paymentTx: txHash,
  });
});
```

## 🛡️ Error Handling

```typescript
app.post("/webhook", myAgent.middleware, (req, res) => {
  try {
    // Your agent logic
    res.json({ result: "Success!" });
  } catch (error) {
    // Return error - user can dispute if agent fails
    res.status(500).json({
      error: "Agent failed",
      details: error.message,
    });
  }
});
```

## 🌐 Networks

- **Testnet**: `avalanche-fuji` (default)
- **Mainnet**: `avalanche` (coming soon)

## 📚 Examples

- [Weather Agent](./examples/weather-agent.js)
- [Code Generator](./examples/code-agent.js)
- [Image Analyzer](./examples/vision-agent.js)

## 🔗 Links

- [Elaru.AI Marketplace](https://elaru.ai)
- [Documentation](https://docs.elaru.ai)
- [Discord](https://discord.gg/elaru)
- [GitHub](https://github.com/elaru-ai/agent-sdk)

---

**Built for Avalanche** 🔺 **Powered by x402** ⚡
