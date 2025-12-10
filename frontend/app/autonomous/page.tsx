"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createThirdwebClient } from "thirdweb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Shield,
  Zap,
  ArrowLeft,
  Wallet,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import {
  AgentWalletPanel,
  BudgetAuthorization,
  AutonomousPaymentStatus,
  AutonomousPayment,
} from "@/components/AgentWallet";
import {
  AgentWallet,
  loadAgentWallet,
  getUSDCBalance,
  formatUSDCBalance,
  formatUSDCAmount,
} from "@/lib/agent-wallet";
import {
  createAutonomousFetch,
  AutonomousPaymentConfig,
} from "@/lib/agent-payment";

// Create thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// Smart commands that trigger multiple agent calls
const SMART_COMMANDS: Record<string, { agents: string[]; description: string }> = {
  "market summary": {
    agents: ["crypto-oracle"],
    description: "Get prices for top cryptocurrencies (BTC, ETH, AVAX)",
  },
  "full report": {
    agents: ["weather-prophet", "crypto-oracle"],
    description: "Weather + Crypto combined intelligence",
  },
  "research mode": {
    agents: ["code-assistant", "crypto-oracle"],
    description: "Code analysis + market data",
  },
};

// Demo agent configurations (matching your backend)
const DEMO_AGENTS = {
  "weather-prophet": {
    id: "weather-prophet",
    name: "Weather Prophet",
    endpoint: `${process.env.NEXT_PUBLIC_BACKEND_URL}/agents/weather/webhook`,
    price: 100000, // $0.10
  },
  "crypto-oracle": {
    id: "crypto-oracle",
    name: "Crypto Oracle",
    endpoint: `${process.env.NEXT_PUBLIC_BACKEND_URL}/agents/crypto/webhook`,
    price: 100000, // $0.10
  },
  "code-assistant": {
    id: "code-assistant",
    name: "Code Assistant",
    endpoint: `${process.env.NEXT_PUBLIC_BACKEND_URL}/agents/code/webhook`,
    price: 100000, // $0.10
  },
};

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  agentName?: string;
  cost?: number;
}

export default function AutonomousAgentPage() {
  const { address } = useAccount();
  const [agentWallet, setAgentWallet] = useState<AgentWallet | null>(null);
  const [agentBalance, setAgentBalance] = useState<bigint>(BigInt(0));
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<AutonomousPayment[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFunding, setShowFunding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load agent wallet
  useEffect(() => {
    if (address) {
      const wallet = loadAgentWallet(address);
      if (wallet) {
        setAgentWallet(wallet);
      }
    }
  }, [address]);

  // Fetch balance
  useEffect(() => {
    if (!agentWallet) return;

    const fetchBalance = async () => {
      const balance = await getUSDCBalance(agentWallet.address, client);
      setAgentBalance(balance);
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [agentWallet]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleWalletReady = useCallback((wallet: AgentWallet) => {
    setAgentWallet(wallet);
    setMessages([{
      id: Date.now().toString(),
      role: "system",
      content: `✅ Agent wallet ready! I can now make autonomous payments.\n\nTry these commands:\n• "What's the weather in Lagos?" - Calls Weather Prophet\n• "Price of ETH" - Calls Crypto Oracle\n• "market summary" - Multi-agent crypto report\n\nNo popups - payments happen automatically!`,
      timestamp: new Date(),
    }]);
  }, []);

  // Detect which agents to call based on message
  const parseIntent = (message: string): { agents: typeof DEMO_AGENTS[keyof typeof DEMO_AGENTS][]; isSmartCommand: boolean } => {
    const lowerMsg = message.toLowerCase();

    // Check smart commands first
    for (const [cmd, config] of Object.entries(SMART_COMMANDS)) {
      if (lowerMsg.includes(cmd)) {
        const agents = config.agents.map(id => DEMO_AGENTS[id as keyof typeof DEMO_AGENTS]).filter(Boolean);
        return { agents, isSmartCommand: true };
      }
    }

    // Single agent detection
    if (lowerMsg.includes("weather") || lowerMsg.includes("forecast") || lowerMsg.includes("temperature")) {
      return { agents: [DEMO_AGENTS["weather-prophet"]], isSmartCommand: false };
    }
    if (lowerMsg.includes("price") || lowerMsg.includes("crypto") || lowerMsg.includes("btc") || lowerMsg.includes("eth") || lowerMsg.includes("bitcoin") || lowerMsg.includes("ethereum")) {
      return { agents: [DEMO_AGENTS["crypto-oracle"]], isSmartCommand: false };
    }
    if (lowerMsg.includes("code") || lowerMsg.includes("debug") || lowerMsg.includes("function") || lowerMsg.includes("program")) {
      return { agents: [DEMO_AGENTS["code-assistant"]], isSmartCommand: false };
    }

    // Default to crypto oracle
    return { agents: [DEMO_AGENTS["crypto-oracle"]], isSmartCommand: false };
  };

  // Make autonomous request to an agent
  const callAgent = async (
    agent: typeof DEMO_AGENTS[keyof typeof DEMO_AGENTS],
    description: string,
    config: AutonomousPaymentConfig
  ): Promise<{ success: boolean; result?: string; error?: string }> => {
    const paymentId = `${Date.now()}-${agent.id}`;

    // Add pending payment
    setPayments(prev => [...prev, {
      id: paymentId,
      targetAgent: agent.id,
      targetAgentName: agent.name,
      amount: agent.price,
      status: "pending",
      timestamp: new Date(),
    }]);

    try {
      const fetchWithPay = createAutonomousFetch(config);

      console.log(`🤖 [Autonomous] Calling ${agent.name}...`);

      const response = await fetchWithPay(agent.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-id": agent.id,
        },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (response.status === 200 && data.result) {
        // Update payment status
        setPayments(prev => prev.map(p =>
          p.id === paymentId
            ? { ...p, status: "success" as const, txHash: data.txHash }
            : p
        ));

        return { success: true, result: data.result };
      } else {
        setPayments(prev => prev.map(p =>
          p.id === paymentId
            ? { ...p, status: "error" as const }
            : p
        ));
        return { success: false, error: data.error || "Request failed" };
      }
    } catch (error) {
      setPayments(prev => prev.map(p =>
        p.id === paymentId
          ? { ...p, status: "error" as const }
          : p
      ));
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing || !agentWallet) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    const { agents } = parseIntent(userMessage.content);

    // Check balance
    const totalCost = agents.reduce((sum, a) => sum + BigInt(a.price), BigInt(0));
    if (agentBalance < totalCost) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `⚠️ Insufficient agent wallet balance. Need ${formatUSDCBalance(totalCost)}, have ${formatUSDCBalance(agentBalance)}. Please add more funds.`,
        timestamp: new Date(),
      }]);
      setIsProcessing(false);
      setShowFunding(true);
      return;
    }

    // Create payment config
    const config: AutonomousPaymentConfig = {
      agentWallet,
      client,
      maxPaymentPerRequest: BigInt(500000), // $0.50 max per request
    };

    // Call each agent
    for (const agent of agents) {
      const result = await callAgent(agent, userMessage.content, config);

      if (result.success && result.result) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + Math.random()).toString(),
          role: "assistant" as const,
          content: result.result!,
          timestamp: new Date(),
          agentName: agent.name,
          cost: agent.price,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + Math.random()).toString(),
          role: "system",
          content: `❌ ${agent.name} failed: ${result.error}`,
          timestamp: new Date(),
        }]);
      }

      // Small delay between agents
      if (agents.length > 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsProcessing(false);
  };

  const isReady = agentWallet && agentBalance > BigInt(0);
  const totalSpent = payments
    .filter(p => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/">
              <Button variant="ghost" className="pl-0 mb-2 text-muted-foreground hover:text-foreground group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              Autonomous Agent Demo
            </h1>
            <p className="text-muted-foreground mt-2">
              AI agents paying AI agents — no popups, no interruptions
            </p>
          </div>

          {isReady && (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 px-3 py-1.5">
                <Wallet className="h-4 w-4 mr-2" />
                {formatUSDCBalance(agentBalance)}
              </Badge>
              {totalSpent > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1.5">
                  <Zap className="h-4 w-4 mr-2" />
                  {formatUSDCAmount(totalSpent)} spent
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Wallet Setup */}
          <div className="lg:col-span-1 space-y-4">
            <AgentWalletPanel
              userAddress={address || ""}
              onWalletReady={handleWalletReady}
              onWalletDeleted={() => {
                setAgentWallet(null);
                setAgentBalance(BigInt(0));
                setMessages([]);
                setPayments([]);
              }}
            />

            {agentWallet && (showFunding || agentBalance === BigInt(0)) && (
              <BudgetAuthorization
                agentWallet={agentWallet}
                userAddress={address || ""}
                onFundingComplete={() => setShowFunding(false)}
              />
            )}

            {/* Quick Commands */}
            {isReady && (
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Commands
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(SMART_COMMANDS).slice(0, 3).map(([cmd, config]) => (
                    <Button
                      key={cmd}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(cmd)}
                      disabled={isProcessing}
                      className="w-full justify-start text-left"
                    >
                      <Zap className="h-3.5 w-3.5 mr-2 text-primary" />
                      {cmd}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Panel - Chat */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border h-[600px] flex flex-col">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Autonomous Chat
                  </CardTitle>
                  {isProcessing && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 animate-pulse">
                      Processing...
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {!isReady && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        <div className="relative h-20 w-20 rounded-2xl bg-card border border-border flex items-center justify-center">
                          <Bot className="h-10 w-10 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Autonomous Agent Commerce
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Create an agent wallet and fund it to enable autonomous payments.
                        Your AI agents will pay other agents automatically.
                      </p>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${
                          msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : msg.role === "system"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-card border border-border"
                        }`}>
                          {msg.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className={`h-4 w-4 ${msg.role === "assistant" ? "text-primary" : ""}`} />
                          )}
                        </div>

                        <div className={`flex flex-col max-w-[80%] ${
                          msg.role === "user" ? "items-end" : "items-start"
                        }`}>
                          {msg.agentName && (
                            <span className="text-xs text-primary font-medium mb-1">
                              {msg.agentName}
                            </span>
                          )}
                          <div className={`rounded-xl px-4 py-3 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : msg.role === "system"
                              ? "bg-yellow-500/10 border border-yellow-500/20 text-foreground rounded-tl-sm"
                              : "bg-card border border-border text-foreground rounded-tl-sm"
                          }`}>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                          {msg.cost && (
                            <span className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5" />
                              Paid {formatUSDCAmount(msg.cost)}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Payment Status */}
              {payments.length > 0 && (
                <div className="px-4 py-3 border-t border-border">
                  <AutonomousPaymentStatus
                    payments={payments}
                    isProcessing={isProcessing}
                  />
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isReady ? "Ask about weather, crypto prices, or use a smart command..." : "Set up agent wallet first..."}
                    disabled={!isReady || isProcessing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-background border-border"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!isReady || !input.trim() || isProcessing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  <Shield className="inline h-3 w-3 mr-1" />
                  Payments are automatic — no popups or approvals needed
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/30 border-border">
            <CardContent className="pt-6">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Zero Popups</h3>
              <p className="text-sm text-muted-foreground">
                Agents pay other agents instantly without interrupting your workflow
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border">
            <CardContent className="pt-6">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Budget Control</h3>
              <p className="text-sm text-muted-foreground">
                You control the spending limit. Agents can only spend what you authorize.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border">
            <CardContent className="pt-6">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Multi-Agent Workflows</h3>
              <p className="text-sm text-muted-foreground">
                Chain multiple agents together for complex research and analysis tasks
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
