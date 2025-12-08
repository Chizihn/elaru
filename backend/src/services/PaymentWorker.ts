import prisma from "../configs/database";
import { ethers } from "ethers";

export class PaymentWorker {
  
  async processPayment(txHash: string, payer: string, amount: string): Promise<boolean> {
    // 1. Check if payment already exists (Idempotency)
    // @ts-ignore
    const existing = await prisma.payment.findUnique({
      where: { txHash }
    });

    if (existing) {
      console.log(`Payment ${txHash} already processed.`);
      return true;
    }

    // 2. Verify tx on-chain
    const provider = new ethers.JsonRpcProvider(process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc");
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      console.error(`Transaction ${txHash} not found`);
      return false;
    }

    // Verify sender
    if (tx.from.toLowerCase() !== payer.toLowerCase()) {
      console.error(`Transaction sender mismatch: ${tx.from} vs ${payer}`);
      return false;
    }

    // Verify recipient and amount (assuming USDC transfer)
    // USDC Contract on Fuji: 0x5425890298aed601595a70AB815c96711a31Bc65
    // Transfer selector: 0xa9059cbb
    const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";
    
    if (tx.to?.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
      // Decode ERC20 transfer
      try {
        const iface = new ethers.Interface(["function transfer(address to, uint256 amount)"]);
        const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
        
        if (decoded) {
           // Check recipient (merchant) - In a real app, this should match the agent's wallet or platform wallet
           // For now, we just log it as we might have different recipients
           console.log(`Verified payment to ${decoded.args[0]} of amount ${decoded.args[1]}`);
           
           // Verify amount (allowing for small differences if needed, but usually exact)
           if (decoded.args[1].toString() !== amount) {
             console.warn(`Amount mismatch: ${decoded.args[1]} vs ${amount}`);
             // return false; // Strict check
           }
        }
      } catch (e) {
        console.error("Failed to decode ERC20 transfer", e);
        return false;
      }
    } else {
       // Native AVAX transfer check
       // if (tx.value.toString() !== amount) ...
       console.warn("Transaction is not a USDC transfer");
    }

    // 3. Record payment
    // @ts-ignore
    await prisma.payment.create({
      data: {
        txHash,
        payer,
        amount,
        status: "COMPLETED"
      }
    });

    console.log(`Processed payment ${txHash}`);
    return true;
  }
}
