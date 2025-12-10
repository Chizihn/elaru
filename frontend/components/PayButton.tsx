"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { normalizeSignatureV } from "@/lib/x402";
import { toast } from "sonner";

interface PayButtonProps {
  agentId: string;
  amount: string;
  endpoint: string;
  taskDescription?: string;
  onPaymentSuccess?: (txHash: string, data?: unknown) => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  hideWrapper?: boolean; // If true, only render the button without wrapper div
}

export function PayButton({
  agentId,
  amount,
  endpoint,
  taskDescription,
  onPaymentSuccess,
  className,
  children,
  disabled,
  hideWrapper = false,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();

  const handlePayment = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Initiating payment...");

    try {
      // 1. Initial Request (Expect 402)
      // Ensure endpoint is absolute or relative to API
      const targetUrl = endpoint.startsWith("http")
        ? endpoint
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`;

      console.log("targeturl", targetUrl);

      const payload = {
        taskId: "test-task-" + Date.now(),
        description:
          taskDescription ||
          "Hello! This is a paid test task from the frontend.",
        serviceType: "Agent",
      };

      console.log("Requesting resource:", targetUrl);
      let response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-id": agentId,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 402) {
        console.log("Received 402 Payment Required");
        const paymentReq = await response.json();
        console.log("Payment requirements:", paymentReq);

        // 2. Parse Payment Requirements - handle both formats
        // Format 1 (x402 middleware): { accepts: [{ network, payTo, maxAmountRequired, asset }] }
        // Format 2 (Elaru SDK): { payment: { network, payTo, amount, token } }
        let option: {
          network: string;
          payTo: string;
          maxAmountRequired: string;
          asset: string;
        };

        if (paymentReq.accepts && paymentReq.accepts[0]) {
          // x402 middleware format
          option = paymentReq.accepts[0];
        } else if (paymentReq.payment) {
          // Elaru SDK format
          option = {
            network: paymentReq.payment.network || "avalanche-fuji",
            payTo: paymentReq.payment.payTo,
            maxAmountRequired: paymentReq.payment.amount,
            asset: paymentReq.payment.token,
          };
        } else {
          throw new Error("No payment options provided in 402 response");
        }

        if (!option.payTo || !option.maxAmountRequired) {
          throw new Error("Invalid payment requirements: missing payTo or amount");
        }

        if (option.network !== "avalanche-fuji") {
          // For hackathon, we strictly expect Fuji
          console.warn("Unexpected network:", option.network);
        }

        // 3. Create Authorization (EIP-3009)
        if (!window.ethereum) throw new Error("No crypto wallet found");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const nonce = ethers.hexlify(ethers.randomBytes(32));
        const validAfter = Math.floor(Date.now() / 1000);
        const validBefore = validAfter + 3600; // 1 hour validity

        const authorization = {
          from: address,
          to: option.payTo,
          value: option.maxAmountRequired,
          validAfter,
          validBefore,
          nonce,
        };

        const domain = {
          name: "USD Coin",
          version: "2",
          chainId: 43113, // Avalanche Fuji
          verifyingContract: option.asset,
        };

        const types = {
          TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
          ],
        };

        // 4. Sign Authorization
        console.log("Signing authorization...");
        toast.info("Please sign the payment authorization in your wallet", {
          id: toastId,
        });
        const rawSignature = await signer.signTypedData(
          domain,
          types,
          authorization
        );
        const signature = normalizeSignatureV(rawSignature, 43113);

        // 5. Construct X-PAYMENT Header
        const paymentPayload = {
          x402Version: 1,
          scheme: "exact",
          network: option.network,
          payload: {
            signature,
            authorization: {
              ...authorization,
              validAfter: authorization.validAfter.toString(),
              validBefore: authorization.validBefore.toString(),
            },
          },
        };

        const xPaymentHeader = btoa(JSON.stringify(paymentPayload));

        // 6. Retry Request with Payment
        console.log("Retrying with X-PAYMENT...");
        toast.loading("Processing payment...", { id: toastId });
        response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-payment": xPaymentHeader,
            "x-agent-id": agentId,
          },
          body: JSON.stringify({
            taskId: "test-task-" + Date.now(),
            description:
              taskDescription ||
              "Hello! This is a paid test task from the frontend.",
            serviceType: "Agent",
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      // 7. Handle Success
      const data = await response.json();
      console.log("Resource received:", data);

      // Extract transaction hash - prioritize response body (from agent), then header
      let txHash = data.txHash || null;
      
      // Fallback to X-PAYMENT-RESPONSE header if not in body
      if (!txHash) {
        const xPaymentResponse = response.headers.get("X-PAYMENT-RESPONSE");
        if (xPaymentResponse) {
          try {
            const decoded = JSON.parse(atob(xPaymentResponse));
            txHash = decoded.transaction || null;
          } catch (e) {
            console.error("Failed to decode payment response header", e);
          }
        }
      }

      console.log("Transaction hash:", txHash);
      if (txHash) {
        toast.success("Payment successful!", {
          id: toastId,
          action: {
            label: "View on Explorer",
            onClick: () => window.open(`https://testnet.snowtrace.io/tx/${txHash}`, "_blank"),
          },
          duration: 10000, // Keep it visible longer so user has time to click
        });
      } else {
        toast.success("Payment successful!", { id: toastId });
      }

      if (onPaymentSuccess) {
        onPaymentSuccess(txHash || "0x...", data);
      }
    } catch (err: unknown) {
      console.error("Payment flow error:", err);
      // Show error as toast instead of inline
      if (err instanceof Error) {
        const error = err as { code?: number };
        if (error.code === 4001 || err.message?.includes("rejected")) {
          toast.error("Transaction rejected by user", { id: toastId });
        } else {
          toast.error(err.message || "Payment failed", { id: toastId });
        }
      } else {
        toast.error("An unknown error occurred", { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonElement = (
    <Button
      onClick={handlePayment}
      disabled={loading || !address || disabled}
      className={className || "w-full"}
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : children ? (
        children
      ) : !address ? (
        "Connect Wallet"
      ) : (
        `Pay ${(parseInt(amount) / 1000000).toFixed(2)} USDC & Access`
      )}
    </Button>
  );

  // For compact layouts like chat, just return the button
  if (hideWrapper) {
    return buttonElement;
  }

  // Full version with additional info
  return (
    <div className="space-y-2">
      {buttonElement}

      {!address && (
        <p className="text-xs text-muted-foreground text-center">
          Connect your wallet to make payments
        </p>
      )}
    </div>
  );
}

