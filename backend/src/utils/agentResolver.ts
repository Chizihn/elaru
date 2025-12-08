import { Request } from "express";
import prisma from "../configs/database";

/**
 * Resolves an agent's wallet address from the request headers
 * Used by x402 middleware for dynamic payment routing
 */
export async function resolveAgentWallet(req: Request): Promise<string> {
  const agentId = (req.headers["x-agent-id"] ||
    req.headers["X-AGENT-ID"]) as string;

  if (!agentId) {
    throw new Error("Agent ID required in X-AGENT-ID header");
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { walletAddress: true, name: true, active: true },
  });

  if (!agent) {
    throw new Error(`Agent with ID ${agentId} not found`);
  }

  if (!agent.active) {
    throw new Error(`Agent ${agent.name} is currently inactive`);
  }

  if (!agent.walletAddress) {
    throw new Error(`Agent ${agent.name} has no wallet address configured`);
  }

  return agent.walletAddress;
}

/**
 * Gets agent pricing from database
 */
export async function resolveAgentPrice(req: Request): Promise<string> {
  const agentId = (req.headers["x-agent-id"] ||
    req.headers["X-AGENT-ID"]) as string;

  if (!agentId) {
    return "100000"; // Default 0.1 USDC
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { pricePerRequest: true },
  });

  return agent?.pricePerRequest || "100000";
}
