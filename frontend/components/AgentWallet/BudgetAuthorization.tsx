"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createThirdwebClient, prepareContractCall, getContract } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { avalancheFuji } from "thirdweb/chains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowRight,
  Wallet,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AgentWallet,
  getUSDCBalance,
  formatUSDCBalance,
  formatUSDCAmount,
  USDC_FUJI_ADDRESS,
} from "@/lib/agent-wallet";

interface BudgetAuthorizationProps {
  agentWallet: AgentWallet;
  userAddress: string;
  onFundingComplete?: () => void;
  className?: string;
}

// Create thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// Preset budget amounts (in USDC smallest units - 6 decimals)
const BUDGET_PRESETS = [
  { label: "$0.50", value: 500000 },
  { label: "$1.00", value: 1000000 },
  { label: "$2.00", value: 2000000 },
  { label: "$5.00", value: 5000000 },
];

export function BudgetAuthorization({
  agentWallet,
  userAddress,
  onFundingComplete,
  className = "",
}: BudgetAuthorizationProps) {
  const [fundAmount, setFundAmount] = useState(1000000); // Default $1.00
  const [mainBalance, setMainBalance] = useState<bigint>(BigInt(0));
  const [agentBalance, setAgentBalance] = useState<bigint>(BigInt(0));
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const { mutate: sendTransaction, isPending: isFunding } = useSendTransaction();

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    try {
      const [mainBal, agentBal] = await Promise.all([
        getUSDCBalance(userAddress, client),
        getUSDCBalance(agentWallet.address, client),
      ]);
      setMainBalance(mainBal);
      setAgentBalance(agentBal);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [userAddress, agentWallet.address]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const handleFund = async () => {
    if (!userAddress || !agentWallet) return;

    try {
      const contract = getContract({
        client,
        chain: avalancheFuji,
        address: USDC_FUJI_ADDRESS,
      });

      const transaction = prepareContractCall({
        contract,
        method: "function transfer(address to, uint256 amount) returns (bool)",
        params: [agentWallet.address as `0x${string}`, BigInt(fundAmount)],
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          toast.success("Budget authorized!", {
            description: `${formatUSDCAmount(fundAmount)} sent to agent wallet`,
          });
          // Refresh balances after a short delay
          setTimeout(fetchBalances, 2000);
          onFundingComplete?.();
        },
        onError: (error) => {
          console.error("Funding failed:", error);
          toast.error("Failed to fund agent wallet", {
            description: error.message,
          });
        },
      });
    } catch (error) {
      console.error("Failed to prepare transaction:", error);
      toast.error("Failed to prepare transaction");
    }
  };

  const maxFundAmount = Math.min(Number(mainBalance), 10000000); // Max $10

  if (isLoadingBalances) {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm border-border ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Authorize Budget
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Current Balances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Your Wallet</span>
            </div>
            <p className="font-semibold text-foreground">
              {formatUSDCBalance(mainBalance)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Agent Wallet</span>
            </div>
            <p className="font-semibold text-primary">
              {formatUSDCBalance(agentBalance)}
            </p>
          </div>
        </div>

        {/* Amount Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount to authorize</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold">
              {formatUSDCAmount(fundAmount)}
            </Badge>
          </div>

          {/* Preset Buttons */}
          <div className="flex gap-2">
            {BUDGET_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={fundAmount === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFundAmount(preset.value)}
                disabled={Number(mainBalance) < preset.value}
                className="flex-1"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Slider for custom amount */}
          <Slider
            value={[fundAmount]}
            onValueChange={(values) => setFundAmount(values[0])}
            min={100000} // $0.10 minimum
            max={maxFundAmount}
            step={100000} // $0.10 steps
            className="py-2"
            disabled={mainBalance === BigInt(0)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0.10</span>
            <span>{formatUSDCAmount(maxFundAmount)}</span>
          </div>
        </div>

        {/* Transfer Visualization */}
        <div className="flex items-center justify-center gap-4 py-3">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-1">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Your Wallet</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-primary/50" />
            <ArrowRight className="h-4 w-4 text-primary" />
            <div className="w-8 h-0.5 bg-primary/50" />
          </div>
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Agent Wallet</span>
          </div>
        </div>

        {/* Fund Button */}
        <Button
          onClick={handleFund}
          disabled={isFunding || mainBalance < BigInt(fundAmount)}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isFunding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authorizing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Authorize {formatUSDCAmount(fundAmount)} Budget
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-center text-muted-foreground">
          Your AI agents will spend from this budget autonomously.
          <br />
          You can add more or withdraw anytime.
        </p>
      </CardContent>
    </Card>
  );
}

export default BudgetAuthorization;
