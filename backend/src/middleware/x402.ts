import { Request, Response, NextFunction } from 'express';
// Use official Thirdweb x402 package
import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { activeChain } from '../config/chains';
import prisma from "../configs/database";

// Initialize Thirdweb client
const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

// Initialize Facilitator
const thirdwebFacilitator = facilitator({
  client,
  serverWalletAddress: process.env.THIRDWEB_SERVER_WALLET_ADDRESS || process.env.MERCHANT_WALLET_ADDRESS!,
});

// USDC Address on Avalanche Fuji
const USDC_FUJI_ADDRESS = process.env.USDC_ADDRESS || "0x5425890298aed601595a70ab815c96711a31bc65";

//  Use thirdweb's pre-defined chain (like x402-starter-kit)
const activeNetwork = avalancheFuji; 

/**
 * Middleware to enforce x402 payment
 * Matches the user's requested implementation structure
 */
export const x402Middleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract payment header (case-insensitive)
      const paymentData = (req.headers['x-payment'] || req.headers['X-PAYMENT']) as string;
      const agentId = (req.headers['x-agent-id'] || req.headers['X-AGENT-ID']) as string;

      // Agent ID is REQUIRED to determine recipient
      if (!agentId) {
        return res.status(400).json({ error: "x-agent-id header is required" });
      }

      // Fetch agent from database - this determines who receives the payment
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { walletAddress: true, pricePerRequest: true, name: true, active: true }
      });

      if (!agent) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
      }

      if (!agent.active) {
        return res.status(403).json({ error: `Agent ${agent.name} is currently inactive` });
      }

      if (!agent.walletAddress) {
        return res.status(500).json({ error: `Agent ${agent.name} has no wallet configured` });
      }

      // Payment recipient is ALWAYS the agent's wallet - this is the marketplace model
      const recipientAddress = agent.walletAddress;
      const priceAmount = agent.pricePerRequest || "100000"; // Fallback to 0.1 USDC if not set

      // Verify payment using Thirdweb x402 (via our shim/wrapper)
      const result = await settlePayment({
        resourceUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        method: req.method,
        paymentData, 
        payTo: recipientAddress,
        network: activeNetwork,
        price: {
          amount: priceAmount,
          asset: {
            address: activeChain.tokenAddress,
          },
        },
        facilitator: thirdwebFacilitator,
      });

      if (result.status === 200) {
        // Attach payment info for downstream controllers if needed
        if (result.paymentReceipt && result.paymentReceipt.transaction) {
            (req as any).paymentTx = result.paymentReceipt.transaction;
            (req as any).payer = result.paymentReceipt.payer;
        }
        
        // Inject response headers early if present (legacy compat)
        if (result.responseHeaders) {
            Object.entries(result.responseHeaders).forEach(([k, v]) => res.set(k, v));
        }

        // Payment successful, proceed to next middleware/handler
        next();
      } else {
        // Payment required (402) or failed
        // For failure, result usually has responseBody or we construct it
        res.status(result.status)
           .set(result.responseHeaders || {})
           // @ts-ignore - responseBody exists on failure types usually, or we fallback
           .json(result.responseBody || { error: "Payment Failed" });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Internal server error during payment verification" });
    }
  };
};

export const paymentMiddleware = x402Middleware; // Alias
