"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createThirdwebClient } from "thirdweb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PayButton } from "@/components/PayButton";
import { ReviewModal } from "@/components/ReviewModal";
import { ChatHistory, HistoryTask } from "@/components/ChatHistory";
import { AgentWalletPanel, AutonomousPaymentStatus, AutonomousPayment } from "@/components/AgentWallet";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Shield,
  TrendingUp,
  Sparkles,
  Lock,
  History,
  Wallet,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useParams, useSearchParams } from "next/navigation";
import { GET_AGENT_DETAILS } from "@/graphql/queries/agents";
import { RECORD_AGENT_INTERACTION } from "@/graphql/mutations/agents";
import { MessageActions } from "@/components/MessageActions";
import { ArtifactRenderer } from "@/components/ArtifactRenderer";
import {
  AgentWallet,
  loadAgentWallet,
  getUSDCBalance,
  formatUSDCBalance,
} from "@/lib/agent-wallet";
import { createAutonomousFetch, AutonomousPaymentConfig } from "@/lib/agent-payment";
import { toast } from "sonner";

// Create thirdweb client
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  txHash?: string;
  relatedTxHash?: string; // For assistant messages, links to the payment
}

interface Agent {
  id: string;
  name: string;
  serviceType: string;
  reputationScore: number;
  pricePerRequest: string;
  description: string;
  endpoint: string;
}

interface ReviewTask {
  id: string;
  paymentTxHash: string;
  agent: {
    id:string;
    serviceType: string;
  };
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentId = params?.agentId as string;
  const initialTask = searchParams.get("task");
  const { address, isConnected } = useAccount();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialTask || "");
  const [isTyping] = useState(false);
  const [reviewTask, setReviewTask] = useState<ReviewTask | null>(null);
  const [selectedHistoryChatId, setSelectedHistoryChatId] = useState<
    string | null
  >(null);
  const [showHistory, setShowHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Autonomous mode state
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [agentWallet, setAgentWallet] = useState<AgentWallet | null>(null);
  const [agentBalance, setAgentBalance] = useState<bigint>(BigInt(0));
  const [autonomousPayments, setAutonomousPayments] = useState<AutonomousPayment[]>([]);
  const [isAutonomousSending, setIsAutonomousSending] = useState(false);

  // Skip query if not connected to avoid variable error
  const { data, loading } = useQuery<{ getAgent: Agent }>(GET_AGENT_DETAILS, {
    variables: { id: agentId, walletAddress: address || "" },
    skip: !agentId || !address,
  });

  const [recordInteraction] = useMutation(RECORD_AGENT_INTERACTION);

  const agent = data?.getAgent;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load agent wallet when address changes
  useEffect(() => {
    if (address) {
      const wallet = loadAgentWallet(address);
      if (wallet) {
        setAgentWallet(wallet);
      }
    }
  }, [address]);

  // Fetch agent wallet balance periodically
  useEffect(() => {
    if (!agentWallet) return;

    const fetchBalance = async () => {
      const balance = await getUSDCBalance(agentWallet.address, thirdwebClient);
      setAgentBalance(balance);
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [agentWallet]);

  // Handle wallet ready from panel
  const handleAgentWalletReady = useCallback((wallet: AgentWallet) => {
    setAgentWallet(wallet);
  }, []);

  // Autonomous send handler
  const handleAutonomousSend = async () => {
    if (!input.trim() || !agent || !agentWallet || isAutonomousSending) return;

    // Check balance
    if (agentBalance < BigInt(agent.pricePerRequest)) {
      toast.error("Insufficient agent wallet balance", {
        description: `Need ${formatUSDCBalance(BigInt(agent.pricePerRequest))}, have ${formatUSDCBalance(agentBalance)}`,
      });
      return;
    }

    setIsAutonomousSending(true);
    const paymentId = `${Date.now()}-${agent.id}`;
    const userContent = input.trim();
    setInput("");

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Add pending payment
    setAutonomousPayments((prev) => [
      ...prev,
      {
        id: paymentId,
        targetAgent: agent.id,
        targetAgentName: agent.name || agent.serviceType,
        amount: parseInt(agent.pricePerRequest),
        status: "pending",
        timestamp: new Date(),
      },
    ]);

    try {
      const config: AutonomousPaymentConfig = {
        agentWallet,
        client: thirdwebClient,
        maxPaymentPerRequest: BigInt(agent.pricePerRequest),
      };

      const fetchWithPay = createAutonomousFetch(config);

      const response = await fetchWithPay(agent.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-agent-id": agent.id,
        },
        body: JSON.stringify({ description: userContent }),
      });

      const data = await response.json();

      if (response.status === 200 && data.result) {
        // Update payment status
        setAutonomousPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId
              ? { ...p, status: "success" as const, txHash: data.txHash }
              : p
          )
        );

        // Add assistant message
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.result,
          timestamp: Date.now() + 1,
          relatedTxHash: data.txHash,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Record interaction
        try {
          await recordInteraction({
            variables: {
              agentId: agent.id,
              description: userContent,
              txHash: data.txHash || "autonomous-payment",
              result: data.result,
            },
            refetchQueries: ["GetUserTasks"],
            awaitRefetchQueries: true,
          });
        } catch (err) {
          console.error("Failed to record interaction:", err);
        }

        toast.success("Autonomous payment successful!", {
          description: `Paid ${formatUSDCBalance(BigInt(agent.pricePerRequest))} to ${agent.name || agent.serviceType}`,
        });
      } else {
        setAutonomousPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId ? { ...p, status: "error" as const } : p
          )
        );
        toast.error("Request failed", {
          description: data.error || "Unknown error",
        });
      }
    } catch (error) {
      setAutonomousPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: "error" as const } : p
        )
      );
      toast.error("Autonomous payment failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsAutonomousSending(false);
    }
  };

  const handlePaymentSuccess = async (
    txHash: string,
    responseData: unknown
  ) => {
    if (responseData && typeof responseData === 'object' && 'result' in responseData && typeof (responseData as any).result === 'string') {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        timestamp: Date.now(),
        txHash,
      };

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: (responseData as any).result || "No response received.",
        timestamp: Date.now() + 1,
        relatedTxHash: txHash, // Link response to the payment
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      // Record interaction for history
      if (!agent) return; // Guard against undefined agent

      try {
        await recordInteraction({
          variables: {
            agentId: agent.id,
            description: input,
            txHash: txHash || "0x...",
            result: (responseData as any).result || "No response",
          },
          refetchQueries: ["GetUserTasks"],
          awaitRefetchQueries: true,
        });
      } catch (err) {
        console.error("Failed to record interaction:", err);
      }
      setInput("");
    } else {
      console.error("Invalid response data structure from onPaymentSuccess");
    }
  };

  // Handle selecting a chat from history
  const handleSelectHistoryChat = (task: HistoryTask) => {
    setSelectedHistoryChatId(task.id);
    // Load past messages from the task
    const loadedMessages: Message[] = [
      {
        id: `${task.id}-user`,
        role: "user" as const,
        content: task.description,
        timestamp: new Date(task.createdAt).getTime(),
        txHash: task.paymentTxHash || undefined,
      },
    ];
    if (task.result) {
      loadedMessages.push({
        id: `${task.id}-assistant`,
        role: "assistant" as const,
        content: task.result,
        timestamp: new Date(task.completedAt || task.createdAt).getTime(),
        relatedTxHash: task.paymentTxHash || undefined,
      });
    }
    setMessages(loadedMessages);
  };

  // Clear history selection and start fresh
  const handleClearHistorySelection = () => {
    setSelectedHistoryChatId(null);
    setMessages([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center space-y-8 bg-background">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative h-24 w-24 rounded-3xl bg-card border border-border flex items-center justify-center shadow-2xl ring-1 ring-white/10">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-foreground ">Connect Wallet</h2>
          <p className="text-muted-foreground leading-relaxed">
            Please connect your wallet to chat with this agent. You need a wallet to sign requests and verify payments on the Elaru Protocol.
          </p>
        </div>
      </div>
    );
  }

  return (
    // Root container: Use fixed positioning to bypass global layout flow and prevent body scroll
    // top-16 accounts for the h-16 (4rem) Navbar
    <div className="fixed inset-x-0 bottom-0 top-16 flex w-full bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar (Desktop) - Static, no scroll unless content overflows */}
      <div className="hidden md:flex w-80 flex-none flex-col border-r border-border bg-card/30 backdrop-blur-xl p-6 space-y-6 z-20 overflow-y-auto custom-scrollbar">
        <Link href={`/agent/${agentId}`}>
          <Button
            variant="ghost"
            className="pl-0 text-muted-foreground hover:text-primary transition-all mb-4 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Button>
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-16 w-16 rounded-2xl bg-primary/10" />
            <div className="h-4 w-3/4 bg-primary/5 rounded" />
            <div className="h-4 w-1/2 bg-primary/5 rounded" />
          </div>
        ) : agent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Agent Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <ShieldCheck className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">
                  {agent.name || agent.serviceType}
                </h2>
                <div className="flex items-center gap-1 text-xs text-green-500 font-medium">
                  <Sparkles className="h-3 w-3" /> Verified Agent
                </div>
                <Badge
                  variant="outline"
                  className="mt-2 bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-xs w-fit"
                >
                  {agent.serviceType}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Trust Score
                  </span>
                </div>
                <span className="font-bold text-2xl text-foreground">
                  {agent.reputationScore.toFixed(1)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Price</span>
                </div>
                <span className="font-bold text-2xl text-foreground">
                  {(parseInt(agent.pricePerRequest) / 1000000).toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">USDC</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {agent.description}
              </p>
            </div>

            {/* Security */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    End-to-End Encrypted
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Protected by Elaru Protocol
                  </p>
                </div>
              </div>
            </div>

            {/* Autonomous Mode Toggle */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Autonomous Mode
                  </span>
                </div>
                <Switch
                  checked={autonomousMode}
                  onCheckedChange={setAutonomousMode}
                  disabled={!agentWallet || agentBalance === BigInt(0)}
                />
              </div>
              {autonomousMode ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Agent Wallet</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                      {formatUSDCBalance(agentBalance)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-green-500">
                    ✓ Payments are automatic — no popups!
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {agentWallet ? "Enable to pay automatically from agent wallet" : "Create agent wallet to enable"}
                </p>
              )}
            </div>

            {/* Agent Wallet Panel (collapsed) */}
            {!agentWallet && (
              <AgentWalletPanel
                userAddress={address || ""}
                onWalletReady={handleAgentWalletReady}
                onWalletDeleted={() => {
                  setAgentWallet(null);
                  setAgentBalance(BigInt(0));
                  setAutonomousMode(false);
                }}
              />
            )}
          </motion.div>
        ) : (
          <div className="text-red-400 text-sm">Agent not found</div>
        )}
      </div>

      {/* Main Chat Area - Flex Column */}
      <div className="flex-1 flex flex-col h-full relative bg-background overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)] pointer-events-none" />

        {/* Mobile Header (Fixed at top of chat area on mobile) */}
        <div className="md:hidden flex-none p-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-xl z-20">
          <Link href={`/agent/${agentId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-card text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-semibold text-foreground">
              {agent?.name || "Agent Chat"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-card text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            <History className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Messages Area - Takes remaining space */}
        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 space-y-6">
          <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-end pb-4">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative h-24 w-24 rounded-3xl bg-card border border-border flex items-center justify-center shadow-2xl">
                    <Bot className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    Chat with {agent?.name || "AI Agent"}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Powered by Elaru Protocol. Each message is cryptographically
                    verified and settled on Avalanche.
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-4 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0 border border-border shadow-sm">
                    {msg.role === "user" ? (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-card text-foreground">
                        <Bot className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div
                    className={`flex flex-col max-w-[80%] ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-6 py-4 shadow-sm border border-border ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-invert prose-sm max-w-none [&>p]:leading-relaxed [&_code]:bg-background/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary">
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                const isInline =
                                  !match && !String(children).includes("\n");
                                if (!isInline) {
                                  return (
                                    <ArtifactRenderer
                                      language={match ? match[1] : ""}
                                      code={String(children).replace(/\n$/, "")}
                                    />
                                  );
                                }
                                return (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 px-1 text-[10px] text-muted-foreground font-medium tracking-wide">
                      <span>{formatTime(msg.timestamp)}</span>

                      {/* User Message: Shows Verified link */}
                      {msg.txHash && (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${msg.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline transition-all"
                        >
                          <Zap className="h-3 w-3" /> Verified Payment
                        </a>
                      )}
                    </div>
                    <MessageActions
                      content={msg.content}
                      role={msg.role}
                      className={msg.role === "user" ? "mr-1" : "ml-1"}
                      showRate={msg.role === "assistant" && !!msg.relatedTxHash}
                      onRate={() => {
                        if (agent && msg.relatedTxHash) {
                          setReviewTask({
                            id: msg.id,
                            paymentTxHash: msg.relatedTxHash,
                            agent: {
                              id: agent.id,
                              serviceType: agent.serviceType,
                            },
                          });
                        }
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-card animate-pulse" />
                <div className="h-10 w-24 rounded-2xl bg-card animate-pulse" />
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input Area (Static Footer) - Fixed at bottom of flex column */}
        <div className="flex-none p-4 md:p-6 border-t border-border bg-background/80 backdrop-blur-xl z-20">
          <div className="max-w-5xl mx-auto">
            {/* Autonomous Payment Status */}
            {autonomousMode && autonomousPayments.length > 0 && (
              <div className="mb-4">
                <AutonomousPaymentStatus
                  payments={autonomousPayments}
                  isProcessing={isAutonomousSending}
                />
              </div>
            )}

            <div className="flex gap-3 items-end mb-3">
              <div className="relative flex-1 w-full">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={autonomousMode ? "Type your message (auto-pay enabled)..." : "Type your message..."}
                  className="w-full min-h-14 py-4 px-5 bg-card border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent text-foreground placeholder:text-muted-foreground rounded-xl shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                      e.preventDefault();
                      if (autonomousMode) {
                        handleAutonomousSend();
                      }
                      // For manual mode, PayButton handles submit
                    }
                  }}
                />
              </div>

              {agent && (
                autonomousMode ? (
                  <Button
                    onClick={handleAutonomousSend}
                    disabled={!input.trim() || isAutonomousSending || agentBalance < BigInt(agent.pricePerRequest)}
                    className="h-14 w-14 p-0 rounded-xl bg-green-500 hover:bg-green-600 transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-white"
                  >
                    {isAutonomousSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                ) : (
                  <PayButton
                    agentId={agent.id}
                    amount={agent.pricePerRequest}
                    endpoint={agent.endpoint}
                    taskDescription={input}
                    onPaymentSuccess={handlePaymentSuccess}
                    className="h-14 w-14 p-0 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-primary-foreground"
                    disabled={!input.trim()}
                    hideWrapper
                  >
                    <Send className="h-5 w-5" />
                  </PayButton>
                )
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
              {autonomousMode ? (
                <>
                  <Zap className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">
                    Autonomous mode • Payments are automatic
                  </span>
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3" />
                  <span>
                    Secured by Elaru Protocol • Instant settlement on Avalanche Fuji
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Show History Button */}
      {!showHistory && (
        <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-30">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 p-0 rounded-l-full rounded-r-none border-r-0 bg-background/80 backdrop-blur-xl"
            onClick={() => setShowHistory(true)}
          >
            <History className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Chat History Panel (Desktop only) */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden lg:block w-72 flex-none h-full"
          >
            <ChatHistory
              agentId={agentId}
              onSelectChat={handleSelectHistoryChat}
              selectedChatId={selectedHistoryChatId}
              onClearSelection={handleClearHistorySelection}
              onToggleVisibility={() => setShowHistory(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      {reviewTask && (
        <ReviewModal
          task={reviewTask}
          onClose={() => setReviewTask(null)}
          onSubmit={() => {
            setReviewTask(null);
            // Optional: Show toast or update UI
          }}
        />
      )}
    </div>
  );
}
