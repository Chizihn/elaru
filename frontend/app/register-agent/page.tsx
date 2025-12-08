"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Wallet,
  ShieldCheck,
  Sparkles,
  Eye,
  ArrowRight,
} from "lucide-react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ServiceSelectionModal } from "@/components/ServiceSelectionModal";
import { RegistrationConfirmModal } from "@/components/RegistrationConfirmModal";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  REGISTER_AGENT_MUTATION,
  STAKE_AGENT,
} from "@/graphql/mutations/agents";
import { GET_USER_AGENTS } from "@/graphql/queries/agents";

interface GetUserAgentsData {
  getUserAgents: {
    id: string;
    name: string;
    active: boolean;
  }[];
}

export default function RegisterAgent() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    serviceType: "",
    description: "",
    endpoint: "http://localhost:5000/webhook",
    price: "0.1",
    responseType: "MARKDOWN",
    stakeAmount: "10", // Default high stake for demo
  });
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [registerAgent] = useMutation(REGISTER_AGENT_MUTATION);
  const [stakeAgent] = useMutation(STAKE_AGENT);

  const { data: userAgentsData, loading: checkingAgents } =
    useQuery<GetUserAgentsData>(GET_USER_AGENTS, {
      variables: { walletAddress: address || "" },
      skip: !address,
    });

  const existingAgent = userAgentsData?.getUserAgents?.[0];

  useEffect(() => {
    if (existingAgent) {
      // Optional: Redirect automatically
      // router.push("/dashboard");
    }
  }, [existingAgent, router]);

  useEffect(() => {
    if (isSuccess && hash && address) {
      const handleBackendRegistration = async () => {
        try {
          // 1. Register Agent in DB
          await registerAgent({
            variables: {
              walletAddress: address,
              name: formData.name,
              serviceType: formData.serviceType,
              endpoint: formData.endpoint,
              description: formData.description,
              pricePerRequest: (
                parseFloat(formData.price) * 1000000
              ).toString(), // Convert to smallest unit (e.g. USDC 6 decimals)
              responseType: formData.responseType,
            },
            refetchQueries: ["GetAgents", "GetOperatorData"],
            awaitRefetchQueries: true,
          });

          // 2. Mark as Staked
          await stakeAgent({
            variables: {
              walletAddress: address,
              stakedAmount: parseEther(
                formData.stakeAmount || "0.5"
              ).toString(),
              stakingTxHash: hash,
            },
            refetchQueries: ["GetAgentByWallet", "GetAgents", "GetOperatorData"],
            awaitRefetchQueries: true,
          });

          toast.success("Agent successfully registered and staked!", {
            action: {
              label: "View Transaction",
              onClick: () => window.open(`https://testnet.snowtrace.io/tx/${hash}`, "_blank"),
            },
            duration: 10000,
          });
          router.push("/dashboard");
        } catch (error) {
          console.error("Backend registration failed:", error);
          toast.error(
            "Blockchain tx success, but backend sync failed. Please contact support."
          );
        }
      };

      handleBackendRegistration();
    }
  }, [isSuccess, hash, address, formData, registerAgent, stakeAgent, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Show confirmation modal instead of immediately submitting
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    
    try {
      // Call AgentStaking.stake()
      writeContract({
        address:
          (process.env.NEXT_PUBLIC_AGENT_STAKING_ADDRESS as `0x${string}`) ||
          "0x0000000000000000000000000000000000000000",
        abi: [
          {
            name: "stake",
            type: "function",
            stateMutability: "payable",
            inputs: [
              { name: "name", type: "string" },
              { name: "description", type: "string" },
              { name: "serviceType", type: "string" },
              { name: "endpoint", type: "string" },
            ],
            outputs: [],
          },
        ],
        functionName: "stake",
        args: [
          formData.name,
          formData.description,
          formData.serviceType,
          formData.endpoint,
        ],
        value: parseEther(formData.stakeAmount || "0.5"), // Use custom stake amount
      });
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Failed to initiate registration");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-background to-background text-foreground py-16 ">
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-12 items-start"
        >
          {/* Left Column: Form */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>

                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">
                  Register New Agent
                </h1>
              </div>

              <p className="text-lg text-muted-foreground ms-4">
                Stake AVAX to create a verifiable identity for your AI service
                and join the decentralized reputation network.
              </p>
            </div>

            <Card className="border-white/10 shadow-2xl bg-card/30 backdrop-blur-xl">
              <CardHeader className="mb-3">
                <CardTitle>Agent Details</CardTitle>
                <CardDescription>
                  Define your agent&apos;s capabilities and pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-12 space-y-6">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">
                        Connect Your Wallet
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Please connect your wallet to register an agent. Your wallet address will be used to receive payments.
                      </p>
                    </div>
                  </div>
                ) : checkingAgents ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : existingAgent ? (
                  <div className="text-center py-12 space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">
                        Agent Already Registered
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        This wallet is already associated with an agent{" "}
                        <strong>({existingAgent.name})</strong>. Please switch
                        wallets to register a new agent.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="w-full max-w-sm"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-12">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., SuperBot 3000"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        required
                        className="bg-background/50  focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceType">Service Type</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-background/50 border-white/30 hover:bg-white/5 hover:text-primary"
                        onClick={() => setShowServiceModal(true)}
                      >
                        {formData.serviceType ? (
                          <span className="text-foreground">
                            {formData.serviceType}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Select a service type...
                          </span>
                        )}
                      </Button>
                    </div>

                    <ServiceSelectionModal
                      isOpen={showServiceModal}
                      onClose={() => setShowServiceModal(false)}
                      onSelect={(service) =>
                        setFormData({ ...formData, serviceType: service })
                      }
                    />

                    <div className="space-y-2">
                      <Label htmlFor="responseType">Response Type</Label>
                      <select
                        id="responseType"
                        value={formData.responseType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            responseType: e.target.value,
                          })
                        }
                        className="w-full h-10 px-3 rounded-md bg-background/50 border border-white/30 focus:border-primary/50 text-sm"
                      >
                        <option value="MARKDOWN">Markdown (Default)</option>
                        <option value="JSON">JSON</option>
                        <option value="TEXT">Plain Text</option>
                        <option value="IMAGE">Image URL</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your agent's capabilities..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        required
                        className="min-h-[100px] resize-none bg-background/50  focus:border-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="endpoint">API Endpoint</Label>
                        <Input
                          id="endpoint"
                          placeholder="https://api..."
                          value={formData.endpoint}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endpoint: e.target.value,
                            })
                          }
                          required
                          className="bg-background/50 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (USDC)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="0.1"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          required
                          className="bg-background/50  focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stakeAmount">Stake Amount (AVAX)</Label>
                      <div className="relative">
                        <Input
                          id="stakeAmount"
                          type="number"
                          step="0.1"
                          min="0.5"
                          value={formData.stakeAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stakeAmount: e.target.value,
                            })
                          }
                          required
                          className="bg-background/50 focus:border-primary/50 pr-24"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ≈ ${parseFloat(formData.stakeAmount || "0") * 40} USD
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum 0.5 AVAX. Higher stake = higher trust.
                      </p>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">
                          You are staking
                        </span>
                      </div>
                      <span className="font-bold text-lg">
                        {formData.stakeAmount} AVAX
                      </span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20"
                      size="lg"
                      disabled={!isConnected || isPending || isConfirming}
                      variant="gradient"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : !isConnected ? (
                        <>
                          <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
                        </>
                      ) : (
                        <>
                          Review & Register <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Confirmation Modal */}
            <RegistrationConfirmModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={handleConfirmedSubmit}
              formData={formData}
              isPending={isPending || isConfirming}
            />
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-8 lg:sticky lg:top-24">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Live Preview</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                This is how your agent will appear on the reputation explorer.
              </p>
            </div>

            <motion.div layout className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <Card className="relative border-white/10 bg-card/50 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {formData.name || "Agent Name"}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {formData.serviceType || "Service Type"}
                      </CardDescription>
                    </div>
                    <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold border border-green-500/20" title="All new agents start with a neutral 50/100 reputation score">
                      Score: 50.0
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 New agents start at 50/100 reputation — build trust with good reviews!
                  </p>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Description
                    </div>
                    <p className="text-sm leading-relaxed">
                      {formData.description ||
                        "Your agent description will appear here. Make it clear and concise to attract users."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Price per Request
                      </div>
                      <div className="font-semibold">
                        {formData.price || "0.1"} USDC
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Total Staked
                      </div>
                      <div className="font-semibold">
                        {formData.stakeAmount} AVAX
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
