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
import { contentAgentRouter } from "./content";
import { researchAgentRouter } from "./research";
import { translationAgentRouter } from "./translation";
import { imageAgentRouter } from "./image";

export const agentsRouter = Router();

// Mount agent-specific routers
agentsRouter.use("/weather", weatherAgentRouter);
agentsRouter.use("/code", codeAgentRouter);
agentsRouter.use("/crypto", cryptoAgentRouter);
agentsRouter.use("/content", contentAgentRouter);
agentsRouter.use("/research", researchAgentRouter);
agentsRouter.use("/translation", translationAgentRouter);
agentsRouter.use("/image", imageAgentRouter);

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
      {
        name: "Content Writer",
        endpoint: "/agents/content/webhook",
        description: "AI-powered content creation for blogs, marketing, and social media",
      },
      {
        name: "Research Assistant",
        endpoint: "/agents/research/webhook",
        description: "Topic exploration, market research, and information gathering",
      },
      {
        name: "Translation Agent",
        endpoint: "/agents/translation/webhook",
        description: "Multi-language translation with context awareness",
      },
      {
        name: "Image Generator",
        endpoint: "/agents/image/webhook",
        description: "AI-powered image generation from text descriptions",
      },
    ],
  });
});
