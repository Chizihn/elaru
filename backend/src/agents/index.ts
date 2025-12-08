/**
 * Demo Agents Router
 * 
 * Integrates all demo agents into the main backend API.
 * Each agent uses the Elaru SDK for payment verification.
 */

import { Router } from "express";
import { weatherAgentRouter } from "./weather";
import { codeAgentRouter } from "./code";
import { cryptoAgentRouter } from "./crypto";

export const agentsRouter = Router();

// Mount agent-specific routers
agentsRouter.use("/weather", weatherAgentRouter);
agentsRouter.use("/code", codeAgentRouter);
agentsRouter.use("/crypto", cryptoAgentRouter);

// Agent discovery endpoint
agentsRouter.get("/", (req, res) => {
  res.json({
    agents: [
      {
        name: "Weather Prophet",
        endpoint: "/agents/weather/webhook",
        description: "Real-time weather forecasts with accuracy guarantee",
      },
      {
        name: "Code Assistant",
        endpoint: "/agents/code/webhook",
        description: "AI-powered code explanations and solutions",
      },
      {
        name: "Crypto Oracle",
        endpoint: "/agents/crypto/webhook",
        description: "Real-time cryptocurrency prices and analysis",
      },
    ],
  });
});
