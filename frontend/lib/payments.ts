import { ethers } from "ethers";
import {
  USDC_ADDRESS,
  USDC_ABI,
  FUJI_RPC,
  EIP3009_DOMAIN,
  EIP3009_TYPES,
} from "./usdc";

export interface PaymentAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
  signature: {
    v: number;
    r: string;
    s: string;
  };
}

/**
 * Create EIP-3009 payment authorization (gasless USDC transfer)
 */
export async function createPaymentAuthorization(
  from: string,
  to: string,
  amount: string,
  signer: ethers.Signer
): Promise<PaymentAuthorization> {
  const now = Math.floor(Date.now() / 1000);
  const validAfter = now;
  const validBefore = now + 3600; // Valid for 1 hour
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  const message = {
    from,
    to,
    value: amount,
    validAfter,
    validBefore,
    nonce,
  };

  // Sign with EIP-712
  const signature = await signer.signTypedData(
    EIP3009_DOMAIN,
    EIP3009_TYPES,
    message
  );

  const sig = ethers.Signature.from(signature);

  return {
    from,
    to,
    value: amount,
    validAfter,
    validBefore,
    nonce,
    signature: {
      v: sig.v,
      r: sig.r,
      s: sig.s,
    },
  };
}

/**
 * Submit payment authorization to blockchain (facilitator pays gas)
 */
export async function submitPaymentAuthorization(
  authorization: PaymentAuthorization,
  facilitatorKey: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(FUJI_RPC);
  const facilitator = new ethers.Wallet(facilitatorKey, provider);
  const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, facilitator);

  const tx = await usdcContract.transferWithAuthorization(
    authorization.from,
    authorization.to,
    authorization.value,
    authorization.validAfter,
    authorization.validBefore,
    authorization.nonce,
    authorization.signature.v,
    authorization.signature.r,
    authorization.signature.s
  );

  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Verify payment on-chain
 */
export async function verifyPayment(txHash: string): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(FUJI_RPC);

  try {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return false;
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return false;
    }

    // Verify it's a USDC transfer
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
    const transferEvents = receipt.logs
      .filter((log) => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase())
      .map((log) => {
        try {
          return usdcContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter((event) => event !== null && event.name === "Transfer");

    return transferEvents.length > 0;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
}

/**
 * Get USDC balance
 */
export async function getUSDCBalance(address: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(FUJI_RPC);
  const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

  const balance = await usdcContract.balanceOf(address);
  return ethers.formatUnits(balance, 6); // USDC has 6 decimals
}

/**
 * Check if user has enough USDC
 */
export async function hasEnoughUSDC(
  address: string,
  amount: string
): Promise<boolean> {
  const balance = await getUSDCBalance(address);
  const balanceWei = ethers.parseUnits(balance, 6);
  const amountWei = BigInt(amount);

  return balanceWei >= amountWei;
}
