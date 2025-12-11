"use client";

import { useState, useCallback, useEffect } from "react";
import { createThirdwebClient, prepareContractCall, getContract } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Workflow,
  ArrowRight,
  X,
  GripVertical,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  DollarSign,
  Wallet,
  ArrowLeft,
  Sparkles,
  Star,
  Copy,
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { ReviewModal } from "@/components/ReviewModal";
import {
  useWorkflowStore,
  WorkflowAgent,
  formatWorkflowPrice,
} from "@/lib/workflow-store";
import {
  AgentWallet,
  loadAgentWallet,
  createAgentWallet,
  getUSDCBalance,
  formatUSDCBalance,
  USDC_FUJI_ADDRESS,
} from "@/lib/agent-wallet";
import { createAutonomousFetch, AutonomousPaymentConfig } from "@/lib/agent-payment";
import { AgentWalletPanel } from "@/components/AgentWallet";

// Create thirdweb client
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

interface WorkflowResult {
  agentId: string;
  agentName: string;
  status: "pending" | "running" | "success" | "error";
  result?: string;
  error?: string;
  txHash?: string;
  rated?: boolean;
}

export default function WorkflowPage() {
  const router = useRouter();
  const { address } = useAccount();

  // Workflow store
  const {
    selectedAgents,
    removeAgent,
    clearWorkflow,
    reorderAgents,
    getTotalCost,
  } = useWorkflowStore();

  // State
  const [taskDescription, setTaskDescription] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<WorkflowResult[]>([]);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [agentWallet, setAgentWallet] = useState<AgentWallet | null>(null);
  const [agentBalance, setAgentBalance] = useState<bigint>(BigInt(0));
  const [mainBalance, setMainBalance] = useState<bigint>(BigInt(0));
  const [isFundingAndRunning, setIsFundingAndRunning] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [reviewingAgent, setReviewingAgent] = useState<{
    id: string;
    name: string;
    txHash: string;
    index: number;
  } | null>(null);

  // Wagmi write contract hook for funding
  const { writeContractAsync } = useWriteContract();

  // Load agent wallet and balances on mount/address change
  useEffect(() => {
    if (!address) return;

    const loadBalances = async () => {
      // Load user's main wallet balance
      const mainBal = await getUSDCBalance(address, thirdwebClient);
      setMainBalance(mainBal);

      // Load agent wallet if exists
      const wallet = loadAgentWallet(address);
      if (wallet) {
        setAgentWallet(wallet);
        const agentBal = await getUSDCBalance(wallet.address, thirdwebClient);
        setAgentBalance(agentBal);
      }
    };

    loadBalances();
    const interval = setInterval(loadBalances, 10000);
    return () => clearInterval(interval);
  }, [address]);

  // Handle wallet ready
  const handleAgentWalletReady = useCallback((wallet: AgentWallet) => {
    setAgentWallet(wallet);
    getUSDCBalance(wallet.address, thirdwebClient).then(setAgentBalance);
  }, []);

  // Calculate if we have enough balance
  const totalCost = BigInt(getTotalCost());
  const hasEnoughBalance = agentBalance >= totalCost;
  const canAffordWithMain = mainBalance >= totalCost;

  // ERC20 Transfer ABI
  const erc20Abi = [
    {
      name: 'transfer',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ type: 'bool' }]
    }
  ] as const;

  // Move agent helper
  const moveAgentHelper = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      reorderAgents(index, index - 1);
    } else if (direction === 'down' && index < selectedAgents.length - 1) {
      reorderAgents(index, index + 1);
    }
  };

  // Fund Wallet - One-click fund without running
  const handleFundWallet = async () => {
    if (!address) return;

    if (!canAffordWithMain) {
      toast.error("Insufficient USDC balance in your wallet", {
        description: "Get testnet USDC from faucet.circle.com",
      });
      return;
    }

    setIsFunding(true);
    const toastId = toast.loading("Processing funding transaction...");

    try {
      // Step 1: Create agent wallet if it doesn't exist
      let wallet = agentWallet;
      if (!wallet) {
        toast.loading("Creating agent wallet...", { id: toastId });
        wallet = await createAgentWallet(address, thirdwebClient, "Workflow Wallet");
        setAgentWallet(wallet);
      }

      // Step 2: Fund the agent wallet
      toast.loading("Please sign transaction in your wallet...", { id: toastId });
      
      // Fund with exactly what's needed or a minimum amount if totalCost is 0/low
      // Default to funding the total cost of workflow if > 0, else 5 USDC for general use
      const amountToFund = totalCost > 0 ? totalCost : BigInt(5000000); // 5 USDC

      const txHash = await writeContractAsync({
        address: USDC_FUJI_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [wallet.address as `0x${string}`, amountToFund],
      });

      // Wait for balance to update
      toast.loading("Confirming transaction...", { id: toastId });
      // Simple wait - in production use waitForTransactionReceipt
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Update balance
      const newBalance = await getUSDCBalance(wallet.address, thirdwebClient);
      setAgentBalance(newBalance);

      toast.success("Wallet funded successfully!", { id: toastId });
    } catch (error) {
      console.error("Funding failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("User rejected") || errorMessage.includes("User denied")) {
        toast.info("Transaction cancelled");
      } else {
        toast.error("Funding failed", {
          id: toastId,
          description: errorMessage,
        });
      }
    } finally {
      setIsFunding(false);
    }
  };

  // Fund & Run - One-click fund and execute
  const fundAndRun = async () => {
    if (!address || !taskDescription.trim() || selectedAgents.length === 0) {
      toast.error("Please fill in all requirements");
      return;
    }

    if (!canAffordWithMain) {
      toast.error("Insufficient USDC balance in your wallet", {
        description: "Get testnet USDC from faucet.circle.com",
      });
      return;
    }

    setIsFundingAndRunning(true);
    const toastId = toast.loading("Setting up autonomous workflow...");

    try {
      // Step 1: Create agent wallet if it doesn't exist
      let wallet = agentWallet;
      if (!wallet) {
        toast.loading("Creating agent wallet...", { id: toastId });
        wallet = await createAgentWallet(address, thirdwebClient, "Workflow Wallet");
        setAgentWallet(wallet);
      }

      // Step 2: Fund the agent wallet with exact workflow cost
      toast.loading("Please sign transaction in your wallet...", { id: toastId });
      
      const txHash = await writeContractAsync({
        address: USDC_FUJI_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [wallet.address as `0x${string}`, totalCost],
      });

      // Wait for balance to update
      toast.loading("Confirming transaction...", { id: toastId });
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Update balance
      const newBalance = await getUSDCBalance(wallet.address, thirdwebClient);
      setAgentBalance(newBalance);

      toast.success("Wallet funded! Starting workflow...", { id: toastId });

      // Step 3: Execute the workflow
      setIsFundingAndRunning(false);
      
      // Call executeWorkflow directly with the new wallet
      setAgentWallet(wallet);
      setTimeout(() => {
        executeWorkflowWithWallet(wallet);
      }, 500);

    } catch (error) {
      console.error("Fund & Run failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("User rejected") || errorMessage.includes("User denied")) {
        toast.info("Transaction cancelled");
        toast.info("Transaction cancelled", { id: toastId });
      } else {
        toast.error("Failed to fund & run", {
          id: toastId,
          description: errorMessage,
        });
      }
      setIsFundingAndRunning(false);
    }
  };

  // Execute workflow with specific wallet (for Fund & Run)
  const executeWorkflowWithWallet = async (wallet: AgentWallet) => {
    if (!wallet || !taskDescription.trim() || selectedAgents.length === 0) {
      return;
    }

    setIsExecuting(true);
    setResults([]);
    setCurrentAgentIndex(0);

    // Initialize results
    const initialResults: WorkflowResult[] = selectedAgents.map((agent) => ({
      agentId: agent.id,
      agentName: agent.name || agent.serviceType,
      status: "pending",
    }));
    setResults(initialResults);

    // Execute agents sequentially with context chaining
    const collectedOutputs: { agentName: string; result: string }[] = [];

    for (let i = 0; i < selectedAgents.length; i++) {
      const agent = selectedAgents[i];
      setCurrentAgentIndex(i);

      // Update status to running
      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r))
      );

      try {
        const config: AutonomousPaymentConfig = {
          agentWallet: wallet,
          client: thirdwebClient,
          maxPaymentPerRequest: BigInt(agent.pricePerRequest) * BigInt(150) / BigInt(100), // Add 50% buffer for potential price variance
        };

        const fetchWithPay = createAutonomousFetch(config);

        // Build context from previous agents' outputs with clear instructions
        let promptWithContext: string;
        
        if (collectedOutputs.length > 0) {
          // This is a subsequent agent - give it clear context
          const previousOutput = collectedOutputs[collectedOutputs.length - 1];
          const allPreviousOutputs = collectedOutputs
            .map((o) => `[${o.agentName}]: ${o.result}`)
            .join("\n\n");
          
          promptWithContext = `You are agent ${i + 1} of ${selectedAgents.length} in a multi-agent workflow.

YOUR ROLE: ${agent.name || agent.serviceType}

IMPORTANT: Process the output from the previous agent(s) to complete your part of this workflow.

=== PREVIOUS AGENT OUTPUT (use this as your input) ===
${previousOutput.result}

=== FULL WORKFLOW CONTEXT ===
Original user request: "${taskDescription}"

All previous outputs:
${allPreviousOutputs}

=== YOUR TASK ===
Based on the previous agent's output above, perform your specialized task (${agent.serviceType}).
Do NOT repeat the user's original request - instead, TRANSFORM/PROCESS the previous output.`;
        } else {
          // First agent - just use the task description
          promptWithContext = taskDescription;
        }

        const response = await fetchWithPay(agent.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-agent-id": agent.id,
          },
          body: JSON.stringify({ description: promptWithContext }),
        });

        const data = await response.json();

        if (response.status === 200 && data.result) {
          // Collect output for context chaining
          collectedOutputs.push({
            agentName: agent.name || agent.serviceType,
            result: data.result,
          });

          setResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: "success",
                    result: data.result,
                    txHash: data.txHash,
                  }
                : r
            )
          );
        } else {
          setResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? { ...r, status: "error", error: data.error || "Request failed" }
                : r
            )
          );
        }
      } catch (error) {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "error",
                  error: error instanceof Error ? error.message : "Unknown error",
                }
              : r
          )
        );
      }

      // Refresh balance after each call
      const newBalance = await getUSDCBalance(wallet.address, thirdwebClient);
      setAgentBalance(newBalance);
    }

    setIsExecuting(false);
    setCurrentAgentIndex(-1);
    toast.success("Workflow completed!", {
      description: `Executed ${selectedAgents.length} agents`,
    });
  };

  // Execute workflow
  const executeWorkflow = async () => {
    if (!agentWallet || !taskDescription.trim() || selectedAgents.length === 0) {
      toast.error("Please fill in all requirements");
      return;
    }

    if (!hasEnoughBalance) {
      toast.error("Insufficient agent wallet balance", {
        description: `Need ${formatWorkflowPrice(getTotalCost())}, have ${formatUSDCBalance(agentBalance)}`,
      });
      return;
    }

    executeWorkflowWithWallet(agentWallet);
  };

  // Empty state
  if (selectedAgents.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-20 text-center max-w-2xl mx-auto">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Workflow className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">No Agents Selected</h1>
          <p className="text-muted-foreground mb-8">
            Go to the Agents page and select agents to build your workflow.
          </p>
          <Button onClick={() => router.push("/agents")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8 space-y-8 px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/agents">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Workflow Builder</h1>
            </div>
            <p className="text-muted-foreground ml-2">
              Design and execute multi-agent autonomous workflows.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 relative items-start">
          
          {/* LEFT COLUMN: VISUALIZATION & RESULTS (Main Workspace) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Agent Pipeline
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearWorkflow}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {selectedAgents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No agents selected.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedAgents.map((agent, index) => {
                      const result = results[index];
                      const isFirst = index === 0;
                      const isLast = index === selectedAgents.length - 1;

                      return (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative"
                        >
                          {/* Connector Line with Context Flow */}
                          {!isLast && (
                            <div className="absolute left-8 top-full h-8 flex flex-col items-center justify-center z-0 -ml-px w-full pointer-events-none">
                              <div className="h-full w-0.5 bg-gradient-to-b from-border to-green-500/50" />
                              <div className="absolute top-1/2 bg-background border border-green-500/30 text-[10px] text-green-600 px-1.5 py-0.5 rounded-full shadow-sm">
                                Context
                              </div>
                            </div>
                          )}

                          <div
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all relative bg-card hover:shadow-md ${
                              result?.status === "running"
                                ? "border-green-500 bg-green-500/5 ring-1 ring-green-500/20"
                                : result?.status === "success"
                                ? "border-green-500/50 bg-green-500/5"
                                : result?.status === "error"
                                ? "border-red-500/50 bg-red-500/5"
                                : "border-border"
                            }`}
                          >
                            {/* Order Number / Status Icon */}
                            <div
                              className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                result?.status === "running"
                                  ? "bg-green-500 text-white"
                                  : result?.status === "success"
                                  ? "bg-green-500/20 text-green-500 border border-green-500/20"
                                  : result?.status === "error"
                                  ? "bg-red-500/20 text-red-500 border border-red-500/20"
                                  : "bg-secondary text-secondary-foreground border border-border"
                              }`}
                            >
                              {result?.status === "running" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : result?.status === "success" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : result?.status === "error" ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                index + 1
                              )}
                            </div>

                            {/* Agent Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-lg leading-tight truncate">
                                    {agent.name || agent.serviceType}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs font-normal">
                                      {agent.serviceType}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {formatWorkflowPrice(parseInt(agent.pricePerRequest))} per run
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Reordering Controls */}
                                {!isExecuting && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={isFirst}
                                      onClick={() => moveAgentHelper(index, 'up')}
                                      title="Move Up"
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={isLast}
                                      onClick={() => moveAgentHelper(index, 'down')}
                                      title="Move Down"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <div className="w-px h-4 bg-border mx-1" />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => removeAgent(agent.id)}
                                      title="Remove from workflow"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Running/Result Output */}
                              <div className="mt-3">
                                {result?.result && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-sm"
                                  >
                                    <p className="whitespace-pre-wrap text-foreground/90 font-mono text-xs">
                                      {result.result}
                                    </p>
                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-green-500/20">
                                      {result.txHash && (
                                        <a
                                          href={`https://testnet.snowtrace.io/tx/${result.txHash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-green-600 hover:text-green-700 hover:underline flex items-center"
                                        >
                                          View TX <ExternalLink className="h-3 w-3 ml-1" />
                                        </a>
                                      )}
                                      {!result.rated ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10 px-2"
                                          onClick={() => setReviewingAgent({
                                            id: agent.id,
                                            name: agent.name || agent.serviceType,
                                            txHash: result.txHash || "",
                                            index,
                                          })}
                                        >
                                          <Star className="h-3 w-3 mr-1" />
                                          Rate Output
                                        </Button>
                                      ) : (
                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center">
                                          <Star className="h-3 w-3 mr-1 fill-current" /> Rated
                                        </span>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                                {result?.error && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600"
                                  >
                                    Error: {result.error}
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                
                {/* Final Success Indicator */}
                {selectedAgents.length > 0 && currentAgentIndex === -1 && !isExecuting && results.length > 0 && results.every(r => r.status === 'success') && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-green-500/5 rounded-xl border-2 border-green-500/20 text-center"
                  >
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-700">Workflow Complete!</h3>
                    <p className="text-sm text-green-600/80">All agents executed successfully.</p>
                  </motion.div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: COMMAND CENTER (Sticky Sidebar) */}
          <div className="lg:col-span-1 space-y-6 sticky top-6">
            
            {/* 1. INPUT: Task Description */}
            <Card className="border-2 border-primary/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">1. Define Task</CardTitle>
                <CardDescription className="text-xs">
                  Describe the initial goal. Agents will pass this context down the chain.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g. Research DeFi trends and summarize..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="h-auto min-h-[5rem] py-3 text-sm resize-none"
                  disabled={isExecuting}
                />
              </CardContent>
            </Card>

            {/* 2. CONTROL: Wallet & Actions */}
            <Card className="border-2 border-primary shadow-lg overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  2. Execute
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                
                {/* Cost Summary */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total Cost</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    {formatWorkflowPrice(Number(getTotalCost()))}
                  </span>
                </div>

                {/* Wallet Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Agent Wallet</span>
                    {agentWallet ? (
                      <Badge variant={hasEnoughBalance ? "outline" : "destructive"} className={hasEnoughBalance ? "border-green-500 text-green-600 bg-green-500/10" : "bg-red-500/10 text-red-500"}>
                        {formatUSDCBalance(agentBalance)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not Created</Badge>
                    )}
                  </div>

                  {/* Funding Actions */}
                  {(!agentWallet || !hasEnoughBalance) && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-500 font-medium">
                        {!agentWallet ? "Wallet needed to run agents." : "Insufficient funds."}
                      </p>
                      
                      {canAffordWithMain ? (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="w-full"
                          onClick={handleFundWallet}
                          disabled={isFunding || isExecuting}
                        >
                          {isFunding ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Wallet className="h-3 w-3 mr-2" />}
                          Fund Wallet ({formatWorkflowPrice(Number(totalCost > 0 ? totalCost : BigInt(5000000)))})
                        </Button>
                      ) : (
                         <Button variant="outline" size="sm" asChild className="w-full border-yellow-500/30 text-yellow-600">
                          <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Get Free Testnet USDC
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* MAIN ACTION BUTTON */}
                {hasEnoughBalance ? (
                  <Button
                    className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-green-900/20 shadow-lg"
                    disabled={!taskDescription.trim() || isExecuting || selectedAgents.length === 0}
                    onClick={executeWorkflow}
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2 fill-current" />
                        Run Workflow
                      </>
                    )}
                  </Button>
                ) : (
                   <Button
                    className="w-full h-12 text-md font-semibold"
                    disabled={!taskDescription.trim() || !canAffordWithMain || isFundingAndRunning || isExecuting}
                    onClick={fundAndRun}
                  >
                    {isFundingAndRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setup & Run...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {canAffordWithMain ? "Fund & Run (One-Click)" : "Insufficient Main Funds"}
                      </>
                    )}
                  </Button>
                )}

                <p className="text-[10px] text-center text-muted-foreground px-4">
                  {hasEnoughBalance 
                    ? "Wallet funded. Ready for autonomous execution." 
                    : "We'll create a dedicated wallet for these agents."}
                </p>

              </CardContent>
            </Card>

             {/* Agent Wallet Info (collapsed/secondary) */}
             {agentWallet && (
               <Card className="border border-border/50 bg-muted/20">
                 <CardContent className="p-3">
                   <div className="flex items-center justify-between gap-2">
                     <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                       {agentWallet.address}
                     </span>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(agentWallet.address);
                          toast.success("Address copied");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                   </div>
                 </CardContent>
               </Card>
             )}

          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewingAgent && (
        <ReviewModal
          task={{
            id: `workflow-${reviewingAgent.index}`,
            paymentTxHash: reviewingAgent.txHash,
            agent: {
              id: reviewingAgent.id,
              serviceType: reviewingAgent.name,
            },
          }}
          onClose={() => setReviewingAgent(null)}
          onSubmit={() => {
            // Mark this agent as rated
            setResults((prev) =>
              prev.map((r, idx) =>
                idx === reviewingAgent.index ? { ...r, rated: true } : r
              )
            );
            setReviewingAgent(null);
            toast.success("Review submitted!", {
              description: "Agent reputation updated based on your feedback",
            });
          }}
        />
      )}
    </div>
  );
}
