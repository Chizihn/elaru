/**
 * Elaru.AI Agent SDK
 *
 * This SDK allows external developers to create AI agents that integrate
 * with the Elaru.AI marketplace without needing access to the main database.
 */

import { Request, Response, NextFunction } from "express";
import { ethers } from "ethers";
import { activeChain } from "../config/chains";
import { settlePayment, facilitator } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";

export interface ElaruAgentConfig {
  walletAddress: string; // Agent's wallet to receive payments
  pricePerRequest: string; // Price in USDC wei (e.g., "100000" = 0.1 USDC)
  name: string; // Agent display name
  description?: string; // Agent description
  network?: string; // Optional override
  usdcAddress?: string; // Optional override
  thirdwebSecretKey?: string; // For settlement
}

export interface PaymentVerification {
  payer: string; // Wallet address of the payer
  amount: string; // Amount paid in wei
  transactionHash?: string; // On-chain transaction hash (if settled)
  verified: boolean; // Whether payment was verified
}

/**
 * Creates an Elaru.AI compatible agent with payment middleware
 */
export function createElaruAgent(config: ElaruAgentConfig) {

  
  // Initialize client inside the function to ensure env vars are loaded
  const secretKey = config.thirdwebSecretKey || process.env.THIRDWEB_SECRET_KEY;
  
  if (!secretKey) {
    console.error("❌ [SDK] THIRDWEB_SECRET_KEY is missing! Check your .env file.");
    throw new Error("THIRDWEB_SECRET_KEY is required but was not found in environment or config");
  }
  

  
  const client = createThirdwebClient({
    secretKey: secretKey,
  });
  
  const usdcAddress = config.usdcAddress || activeChain.tokenAddress;
  // Use thirdweb's pre-defined chain (like x402-starter-kit does)
  const chain = avalancheFuji;

  // Validate configuration
  if (!ethers.isAddress(config.walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  if (!config.pricePerRequest || BigInt(config.pricePerRequest) <= 0) {
    throw new Error("Invalid price per request");
  }

  const serverWalletAddress = process.env.THIRDWEB_SERVER_WALLET_ADDRESS;
  if (!serverWalletAddress) {
    console.error("❌ [SDK] THIRDWEB_SERVER_WALLET_ADDRESS is missing!");
    throw new Error("THIRDWEB_SERVER_WALLET_ADDRESS is required but was not found");
  }
  

  // Initialize Facilitator (acting as the agent server itself here)
  const agentFacilitator = facilitator({
      client,
      serverWalletAddress: serverWalletAddress
  });

  /**
   * Express middleware that enforces x402 payment
   */
  const middleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const paymentHeader = req.headers["x-payment"] as string;

    try {
        const result = await settlePayment({
            resourceUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            method: req.method,
            paymentData: paymentHeader,
            payTo: config.walletAddress,
            network: chain,
            price: {
                amount: config.pricePerRequest,
                asset: { address: usdcAddress }
            },
            facilitator: agentFacilitator
        });

        if (result.status === 200) {
            // Payment Success
             // Attach payment info to request
            (req as any).payment = {
                payer: result.paymentReceipt?.payer,
                amount: config.pricePerRequest,
                verified: true,
                transactionHash: result.paymentReceipt?.transaction
            } as PaymentVerification;
            
             // Inject response headers 
            if (result.responseHeaders) {
                Object.entries(result.responseHeaders).forEach(([k, v]) => res.set(k, v));
            }

            next();
        } else {
             // Payment Required/Failed
             // @ts-ignore
             return res.status(result.status).set(result.responseHeaders || {}).json(result.responseBody || {});
        }

    } catch (error: any) {
      console.error(
        `❌ [${config.name}] SDK Payment Logic failed:`,
        error.message
      );
      return res.status(500).json({
        error: "Internal payment processing error",
        details: error.message,
      });
    }
  };

  return {
    config,
    middleware,

    // Helper methods
    getPaymentInfo: (req: Request): PaymentVerification | null => {
      return (req as any).payment || null;
    },

    // Agent registration helper (for Elaru marketplace)
    getRegistrationData: () => ({
      name: config.name,
      description: config.description || "",
      walletAddress: config.walletAddress,
      pricePerRequest: config.pricePerRequest,
      network: "avalanche-fuji", // Standardize
      serviceType: "EXTERNAL", 
    }),
  };
}

// Deprecated: settlePayment is now internal to the middleware flow via Thirdweb style
export async function legacySettlePayment(req: Request, serverPrivateKey: string): Promise<string | null> {
    console.warn("legacySettlePayment is deprecated. Use the automatic settlement in middleware.");
    return null; 
}
