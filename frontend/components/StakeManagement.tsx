"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Minus, 
  Loader2, 
  AlertTriangle, 
  Coins,
  ArrowUpCircle,
  ArrowDownCircle 
} from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "sonner";

// AgentStaking contract ABI (minimal)
const STAKING_ABI = [
  {
    name: "addStake",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "stakes",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "MINIMUM_STAKE",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Contract address - should match your deployed contract
const STAKING_CONTRACT = process.env.NEXT_PUBLIC_STAKING_CONTRACT || "0x...";

interface StakeManagementProps {
  agentAddress: string;
  currentStake: bigint;
  onStakeUpdated?: () => void;
}

export function StakeManagement({
  agentAddress,
  currentStake,
  onStakeUpdated,
}: StakeManagementProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const MINIMUM_STAKE = parseEther("0.5");

  // Add stake transaction
  const { 
    writeContract: addStake, 
    data: addHash,
    isPending: isAddPending 
  } = useWriteContract();

  const { isLoading: isAddConfirming, isSuccess: isAddSuccess } = 
    useWaitForTransactionReceipt({ hash: addHash });

  // Withdraw transaction
  const { 
    writeContract: withdraw, 
    data: withdrawHash,
    isPending: isWithdrawPending 
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = 
    useWaitForTransactionReceipt({ hash: withdrawHash });

  // Handle add stake
  const handleAddStake = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      addStake({
        address: STAKING_CONTRACT as `0x${string}`,
        abi: STAKING_ABI,
        functionName: "addStake",
        value: parseEther(amount),
      });
      toast.info("Transaction submitted...");
    } catch (error: any) {
      toast.error("Transaction failed", { description: error.message });
    }
  };

  // Handle withdraw
  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const withdrawAmount = parseEther(amount);
    const remainingStake = currentStake - withdrawAmount;

    // Check if partial withdrawal maintains minimum
    if (remainingStake > BigInt(0) && remainingStake < MINIMUM_STAKE) {
      toast.error("Must maintain minimum 0.5 AVAX stake", {
        description: "Withdraw all or leave at least 0.5 AVAX",
      });
      return;
    }

    try {
      withdraw({
        address: STAKING_CONTRACT as `0x${string}`,
        abi: STAKING_ABI,
        functionName: "withdraw",
        args: [withdrawAmount],
      });
      toast.info("Transaction submitted...");
    } catch (error: any) {
      toast.error("Transaction failed", { description: error.message });
    }
  };

  // Handle success
  if (isAddSuccess) {
    toast.success("Stake added successfully!");
    setIsAddOpen(false);
    setAmount("");
    onStakeUpdated?.();
  }

  if (isWithdrawSuccess) {
    toast.success("Withdrawal successful!");
    setIsWithdrawOpen(false);
    setAmount("");
    onStakeUpdated?.();
  }

  const isLoading = isAddPending || isAddConfirming || isWithdrawPending || isWithdrawConfirming;
  const maxWithdrawable = currentStake > MINIMUM_STAKE 
    ? currentStake - MINIMUM_STAKE 
    : currentStake;

  return (
    <div className="space-y-3">
      {/* Current Stake Display */}
      <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-purple-400" />
          <span className="text-muted-foreground text-sm">Current Stake</span>
        </div>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          {formatEther(currentStake)} AVAX
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-green-500/30 text-green-500 hover:bg-green-500/10"
          onClick={() => setIsAddOpen(true)}
        >
          <ArrowUpCircle className="h-4 w-4 mr-1" />
          Add Stake
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
          onClick={() => setIsWithdrawOpen(true)}
          disabled={currentStake === BigInt(0)}
        >
          <ArrowDownCircle className="h-4 w-4 mr-1" />
          Withdraw
        </Button>
      </div>

      {/* Add Stake Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
              Add More Stake
            </DialogTitle>
            <DialogDescription>
              Increase your stake to build more trust and earn more.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (AVAX)</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Current stake: {formatEther(currentStake)} AVAX
              </p>
            </div>

            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              onClick={handleAddStake}
              disabled={isLoading || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isAddConfirming ? "Confirming..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {amount || "0"} AVAX
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-orange-500" />
              Withdraw Stake
            </DialogTitle>
            <DialogDescription>
              Withdraw your staked AVAX. Minimum stake: 0.5 AVAX
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-500">Important</p>
                <p className="text-muted-foreground">
                  Withdrawing below 0.5 AVAX will deactivate your agent. 
                  You can withdraw all to fully exit.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (AVAX)</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max={formatEther(currentStake)}
                placeholder="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {formatEther(currentStake)} AVAX</span>
                <button
                  className="text-orange-500 hover:underline"
                  onClick={() => setAmount(formatEther(maxWithdrawable))}
                >
                  Max (keep min)
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => setAmount(formatEther(currentStake))}
                >
                  Withdraw All
                </button>
              </div>
            </div>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={handleWithdraw}
              disabled={isLoading || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isWithdrawConfirming ? "Confirming..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 mr-2" />
                  Withdraw {amount || "0"} AVAX
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
