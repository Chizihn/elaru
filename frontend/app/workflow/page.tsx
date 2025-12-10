"use client";

import { useState, useCallback } from "react";
import { createThirdwebClient } from "thirdweb";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
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
  getUSDCBalance,
  formatUSDCBalance,
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
  const [reviewingAgent, setReviewingAgent] = useState<{
    id: string;
    name: string;
    txHash: string;
    index: number;
  } | null>(null);

  // Load agent wallet on mount
  useState(() => {
    if (address) {
      const wallet = loadAgentWallet(address);
      if (wallet) {
        setAgentWallet(wallet);
        getUSDCBalance(wallet.address, thirdwebClient).then(setAgentBalance);
      }
    }
  });

  // Handle wallet ready
  const handleAgentWalletReady = useCallback((wallet: AgentWallet) => {
    setAgentWallet(wallet);
    getUSDCBalance(wallet.address, thirdwebClient).then(setAgentBalance);
  }, []);

  // Calculate if we have enough balance
  const totalCost = BigInt(getTotalCost());
  const hasEnoughBalance = agentBalance >= totalCost;

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
          agentWallet,
          client: thirdwebClient,
          maxPaymentPerRequest: BigInt(agent.pricePerRequest),
        };

        const fetchWithPay = createAutonomousFetch(config);

        // Build context from previous agents' outputs
        let promptWithContext = taskDescription;
        if (collectedOutputs.length > 0) {
          const contextText = collectedOutputs
            .map((o) => `[${o.agentName}]: ${o.result}`)
            .join("\n\n");
          promptWithContext = `${taskDescription}\n\n--- Context from previous agents ---\n${contextText}`;
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
      const newBalance = await getUSDCBalance(agentWallet.address, thirdwebClient);
      setAgentBalance(newBalance);
    }

    setIsExecuting(false);
    setCurrentAgentIndex(-1);
    toast.success("Workflow completed!", {
      description: `Executed ${selectedAgents.length} agents`,
    });
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
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium border border-green-500/20">
                <Workflow className="h-4 w-4" />
                Workflow Builder
              </div>
            </div>
            <h1 className="text-3xl font-bold">Build Your AI Workflow</h1>
            <p className="text-muted-foreground">
              Configure and execute your multi-agent pipeline
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Workflow Pipeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Pipeline */}
            <Card className="border-2 border-border">
              <CardHeader className="border-b border-border">
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
                <div className="space-y-4">
                  {selectedAgents.map((agent, index) => {
                    const result = results[index];
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative"
                      >
                        {/* Connector Line with Context Flow */}
                        {index < selectedAgents.length - 1 && (
                          <div className="absolute left-6 top-full h-6 flex flex-col items-center z-0">
                            <div className="w-0.5 h-3 bg-green-500/50" />
                            <span className="text-[10px] text-green-500 font-medium">↓ ctx</span>
                          </div>
                        )}

                        <div
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                            result?.status === "running"
                              ? "border-green-500 bg-green-500/5"
                              : result?.status === "success"
                              ? "border-green-500/50 bg-green-500/5"
                              : result?.status === "error"
                              ? "border-red-500/50 bg-red-500/5"
                              : "border-border bg-card"
                          }`}
                        >
                          {/* Order Number */}
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              result?.status === "running"
                                ? "bg-green-500 text-white"
                                : result?.status === "success"
                                ? "bg-green-500/20 text-green-500"
                                : result?.status === "error"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-primary/10 text-primary"
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

                          {/* Agent Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {agent.name || agent.serviceType}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {agent.serviceType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {agent.reputationScore?.toFixed(1)}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {(parseInt(agent.pricePerRequest) / 1000000).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          {!isExecuting && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeAgent(agent.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Result Display */}
                        {result?.result && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="ml-12 mt-2 p-4 rounded-lg bg-green-500/5 border border-green-500/20"
                          >
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {result.result}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-500/20">
                              {result.txHash && (
                                <a
                                  href={`https://testnet.snowtrace.io/tx/${result.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-green-500 hover:underline"
                                >
                                  View Transaction →
                                </a>
                              )}
                              {!result.rated ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                                  onClick={() => setReviewingAgent({
                                    id: agent.id,
                                    name: agent.name || agent.serviceType,
                                    txHash: result.txHash || "",
                                    index,
                                  })}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate Agent
                                </Button>
                              ) : (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                                  Rated
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )}
                        {result?.error && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="ml-12 mt-2 p-4 rounded-lg bg-red-500/5 border border-red-500/20"
                          >
                            <p className="text-sm text-red-400">{result.error}</p>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Arrow to Results */}
                {selectedAgents.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Input */}
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle>Task Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Describe what you want the agents to do..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="h-14 text-lg"
                  disabled={isExecuting}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-green-500 font-semibold">Context Chaining:</span> Each agent receives the outputs of previous agents, enabling true collaboration.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Panel */}
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Agent Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agentWallet ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      <Badge
                        variant="outline"
                        className={`${
                          hasEnoughBalance
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : "bg-red-500/10 text-red-500 border-red-500/30"
                        }`}
                      >
                        {formatUSDCBalance(agentBalance)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Workflow Cost</span>
                      <span className="font-semibold">
                        {formatWorkflowPrice(getTotalCost())}
                      </span>
                    </div>
                    {!hasEnoughBalance && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-400">
                          Insufficient balance. Please fund your agent wallet.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <AgentWalletPanel
                    userAddress={address || ""}
                    onWalletReady={handleAgentWalletReady}
                    onWalletDeleted={() => {
                      setAgentWallet(null);
                      setAgentBalance(BigInt(0));
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-2 border-green-500">
              <CardHeader className="bg-green-500/5">
                <CardTitle className="text-green-500">Workflow Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Agents</span>
                  <span className="font-semibold">{selectedAgents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-semibold text-lg">
                    {formatWorkflowPrice(getTotalCost())}
                  </span>
                </div>

                <Button
                  className="w-full h-14 text-lg bg-green-500 hover:bg-green-600"
                  disabled={
                    !agentWallet ||
                    !taskDescription.trim() ||
                    !hasEnoughBalance ||
                    isExecuting
                  }
                  onClick={executeWorkflow}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Executing... ({currentAgentIndex + 1}/{selectedAgents.length})
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Execute Workflow
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Payments are automatic. No popups!
                </p>
              </CardContent>
            </Card>
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
