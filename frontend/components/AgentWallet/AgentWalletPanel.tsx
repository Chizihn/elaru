"use client";

import { useState, useEffect, useCallback } from "react";
import { createThirdwebClient
} from "thirdweb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bot,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  AgentWallet,
  hasAgentWallet,
  createAgentWallet,
  loadAgentWallet,
  deleteAgentWallet,
  getAgentWalletAddress,
  getUSDCBalance,
  formatUSDCBalance,
} from "@/lib/agent-wallet";

interface AgentWalletPanelProps {
  userAddress: string;
  onWalletReady?: (wallet: AgentWallet) => void;
  onWalletDeleted?: () => void;
  className?: string;
}

// Create thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

export function AgentWalletPanel({
  userAddress,
  onWalletReady,
  onWalletDeleted,
  className = "",
}: AgentWalletPanelProps) {
  const [agentWallet, setAgentWallet] = useState<AgentWallet | null>(null);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load wallet on mount
  useEffect(() => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    const loadWallet = async () => {
      setIsLoading(true);
      try {
        if (hasAgentWallet()) {
          const wallet = loadAgentWallet(userAddress);
          if (wallet) {
            setAgentWallet(wallet);
            onWalletReady?.(wallet);
            
            // Fetch balance
            const bal = await getUSDCBalance(wallet.address, client);
            setBalance(bal);
          }
        }
      } catch (error) {
        console.error("Failed to load agent wallet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWallet();
  }, [userAddress, onWalletReady]);

  // Refresh balance periodically
  useEffect(() => {
    if (!agentWallet) return;

    const fetchBalance = async () => {
      try {
        const bal = await getUSDCBalance(agentWallet.address, client);
        setBalance(bal);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [agentWallet]);

  const handleCreateWallet = async () => {
    if (!userAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    try {
      const wallet = await createAgentWallet(userAddress, client);
      setAgentWallet(wallet);
      onWalletReady?.(wallet);
      toast.success("Agent wallet created successfully!", {
        description: `Address: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
      });
    } catch (error) {
      console.error("Failed to create wallet:", error);
      toast.error("Failed to create agent wallet");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWallet = () => {
    deleteAgentWallet();
    setAgentWallet(null);
    setBalance(BigInt(0));
    setShowDeleteConfirm(false);
    onWalletDeleted?.();
    toast.success("Agent wallet deleted");
  };

  const copyAddress = useCallback(() => {
    if (agentWallet) {
      navigator.clipboard.writeText(agentWallet.address);
      toast.success("Address copied to clipboard");
    }
  }, [agentWallet]);

  const truncateAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Loading state
  if (isLoading) {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm border-border ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // No wallet - show create option
  if (!agentWallet) {
    return (
      <Card className={`bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Autonomous Agent Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a dedicated wallet for your AI agents to make autonomous payments 
            without requiring your approval for each transaction.
          </p>
          
          <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border">
            <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Generate a new wallet for autonomous payments</li>
                <li>Fund it with USDC from your main wallet</li>
                <li>AI agents spend from this budget automatically</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={handleCreateWallet}
            disabled={isCreating || !userAddress}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Agent Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Wallet exists - show details
  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Agent Wallet
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${balance > BigInt(0) ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"}`}
          >
            {balance > BigInt(0) ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
            ) : (
              <><AlertTriangle className="h-3 w-3 mr-1" /> Needs Funding</>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="flex items-center gap-2">
          <Input
            value={agentWallet.address}
            readOnly
            className="font-mono text-xs bg-background/50"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={copyAddress}
            className="shrink-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0"
          >
            <a
              href={`https://testnet.snowtrace.io/address/${agentWallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Balance Display */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-foreground">
                {formatUSDCBalance(balance)}
              </p>
              <p className="text-xs text-muted-foreground">USDC on Avalanche Fuji</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Fund Instructions */}
        {balance === BigInt(0) && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              <strong>Fund your agent wallet:</strong> Send USDC to the address above 
              to enable autonomous payments. Get testnet USDC from{" "}
              <a 
                href="https://faucet.circle.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-yellow-500"
              >
                Circle Faucet
              </a>
            </p>
          </div>
        )}

        {/* Delete Option */}
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-destructive flex-1">Delete this wallet?</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteWallet}
            >
              Delete
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Wallet
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentWalletPanel;
