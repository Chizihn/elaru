/**
 * Autonomous Payment System
 * 
 * Wraps fetch with x402 payment handling using the agent wallet.
 * Enables fully autonomous payments without user popups.
 */

import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { 
  AgentWallet, 
  createAgentAccount, 
  AVALANCHE_FUJI_CHAIN_ID,
  getUSDCBalance,
  formatUSDCBalance
} from "./agent-wallet";
import { normalizeSignatureV } from "./x402";

// Create a normalized fetch that handles signature normalization for Avalanche
function createNormalizedFetch(chainId: number): typeof fetch {
  return async (input, init) => {
    // Extract payment header - check both cases
    let paymentHeader: string | null = null;
    
    if (init?.headers instanceof Headers) {
      paymentHeader = init.headers.get('x-payment') || init.headers.get('X-PAYMENT');
    } else if (typeof init?.headers === 'object' && init.headers !== null) {
      const headers = init.headers as Record<string, string>;
      paymentHeader = headers['x-payment'] || headers['X-PAYMENT'];
    }

    if (paymentHeader) {
      try {
        // Decode base64 payment
        const decoded = JSON.parse(atob(paymentHeader));

        if (decoded.payload?.signature) {
          // Normalize the signature for Avalanche
          const originalSig = decoded.payload.signature;
          const normalizedSig = normalizeSignatureV(originalSig, chainId);

          // Update the signature in the payload
          decoded.payload.signature = normalizedSig;

          // Re-encode to base64
          const normalizedPaymentHeader = btoa(JSON.stringify(decoded));

          // Update headers with normalized payment
          if (init?.headers instanceof Headers) {
            init.headers.set('X-PAYMENT', normalizedPaymentHeader);
          } else if (typeof init?.headers === 'object' && init.headers !== null) {
            const headers = init.headers as Record<string, string>;
            delete headers['x-payment'];
            delete headers['X-PAYMENT'];
            headers['X-PAYMENT'] = normalizedPaymentHeader;
          }
        }
      } catch (e) {
        console.error('Failed to normalize payment:', e);
      }
    }

    return fetch(input, init);
  };
}

export interface AutonomousPaymentConfig {
  maxPaymentPerRequest: bigint; // Max amount to authorize per request (in USDC units)
  agentWallet: AgentWallet;
  client: ReturnType<typeof createThirdwebClient>;
}

export interface AutonomousPaymentResult {
  success: boolean;
  data?: unknown;
  error?: string;
  paymentMade: boolean;
  amountPaid?: number;
}

/**
 * Creates an autonomous payment-enabled fetch function
 * This fetch wrapper automatically handles 402 responses and signs payments
 * using the agent wallet - NO USER POPUPS!
 */
export function createAutonomousFetch(config: AutonomousPaymentConfig) {
  const { agentWallet, client, maxPaymentPerRequest } = config;
  
  // Create the agent account that can sign
  const agentAccount = createAgentAccount(agentWallet, client);
  
  // Create a wallet-like object for wrapFetchWithPayment
  const agentWalletWrapper = {
    getAccount: () => agentAccount,
    getChain: () => ({ id: AVALANCHE_FUJI_CHAIN_ID }),
  };
  
  // Create normalized fetch for Avalanche signature compatibility
  const normalizedFetch = createNormalizedFetch(AVALANCHE_FUJI_CHAIN_ID);
  
  // Wrap with x402 payment handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchWithPay = wrapFetchWithPayment(
    normalizedFetch,
    client,
    agentWalletWrapper as any,
    { maxValue: maxPaymentPerRequest }
  );
  
  return fetchWithPay;
}

/**
 * Make an autonomous payment request to an agent endpoint
 * Handles the full x402 flow automatically using the agent wallet
 */
export async function makeAutonomousRequest(
  endpoint: string,
  agentId: string,
  body: Record<string, unknown>,
  config: AutonomousPaymentConfig
): Promise<AutonomousPaymentResult> {
  try {
    // Check balance first
    const balance = await getUSDCBalance(config.agentWallet.address, config.client);
    
    if (balance < config.maxPaymentPerRequest) {
      return {
        success: false,
        error: `Insufficient agent wallet balance. Have ${formatUSDCBalance(balance)}, need ${formatUSDCBalance(config.maxPaymentPerRequest)}`,
        paymentMade: false,
      };
    }
    
    // Create autonomous fetch
    const fetchWithPay = createAutonomousFetch(config);
    
    console.log(`🤖 [Autonomous] Making request to ${endpoint} for agent ${agentId}`);
    
    // Make the request - x402 payment is handled automatically!
    const response = await fetchWithPay(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-id": agentId,
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (response.status === 200) {
      console.log(`✅ [Autonomous] Request successful, payment settled`);
      return {
        success: true,
        data,
        paymentMade: true,
        amountPaid: data.cost || Number(config.maxPaymentPerRequest),
      };
    } else {
      console.error(`❌ [Autonomous] Request failed:`, data);
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
        paymentMade: false,
      };
    }
  } catch (error) {
    console.error(`❌ [Autonomous] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      paymentMade: false,
    };
  }
}

/**
 * Batch autonomous requests to multiple agents
 * Useful for multi-step workflows where one agent calls multiple others
 */
export async function batchAutonomousRequests(
  requests: Array<{
    endpoint: string;
    agentId: string;
    body: Record<string, unknown>;
  }>,
  config: AutonomousPaymentConfig
): Promise<AutonomousPaymentResult[]> {
  const results: AutonomousPaymentResult[] = [];
  
  for (const req of requests) {
    const result = await makeAutonomousRequest(
      req.endpoint,
      req.agentId,
      req.body,
      config
    );
    results.push(result);
    
    // Small delay between requests for visual effect
    if (requests.length > 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  return results;
}

/**
 * Calculate total cost for a set of agent requests
 */
export function calculateTotalCost(
  agentPrices: string[], // Array of price strings in USDC units
): bigint {
  return agentPrices.reduce((total, price) => {
    return total + BigInt(price);
  }, BigInt(0));
}
