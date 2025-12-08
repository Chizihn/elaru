/**
 * Simple AI Agent Example
 *
 * This shows how external developers can create agents
 * that integrate with Elaru.AI marketplace
 */

const express = require("express");
const { createElaruAgent } = require("@elaru/agent-sdk");

const app = express();
app.use(express.json());

// Create your agent
const myAgent = createElaruAgent({
  walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e", // Replace with your wallet
  pricePerRequest: "50000", // 0.05 USDC per request
  name: "Echo Agent",
  description: "Simple agent that echoes back your message",
});

// Payment-protected endpoint
app.post("/webhook", myAgent.middleware, (req, res) => {
  const { description } = req.body;
  const payment = myAgent.getPaymentInfo(req);

  console.log(`💰 Received payment from ${payment.payer}`);
  console.log(`📝 Task: ${description}`);

  // Simple echo logic
  const result = `Echo: ${description}`;

  res.json({
    result,
    agent: "Echo Agent",
    paidBy: payment.payer,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    agent: myAgent.config.name,
    price: myAgent.config.pricePerRequest + " USDC wei",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🤖 Echo Agent running on http://localhost:${PORT}
💰 Price: ${myAgent.config.pricePerRequest} USDC wei (${
    parseInt(myAgent.config.pricePerRequest) / 1000000
  } USDC)
🔗 Webhook: http://localhost:${PORT}/webhook
💳 Payments to: ${myAgent.config.walletAddress}
  `);
});
