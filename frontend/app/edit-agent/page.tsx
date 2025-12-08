"use client";

import { useState, useMemo } from "react";
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
import { Loader2, Pencil, ArrowLeft, Save, AlertCircle } from "lucide-react";
import { getErrorMessage } from "@/utils/graphqlErrors";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const GET_AGENT_BY_WALLET = gql`
  query GetAgentByWallet($walletAddress: String!) {
    getAgentByWallet(walletAddress: $walletAddress) {
      id
      name
      serviceType
      description
      endpoint
      pricePerRequest
      walletAddress
      stakedAmount
      active
    }
  }
`;

const UPDATE_AGENT = gql`
  mutation UpdateAgent(
    $walletAddress: String!
    $name: String
    $description: String
    $endpoint: String
    $pricePerRequest: String
  ) {
    updateAgent(
      walletAddress: $walletAddress
      name: $name
      description: $description
      endpoint: $endpoint
      pricePerRequest: $pricePerRequest
    ) {
      id
      name
      description
      endpoint
      pricePerRequest
    }
  }
`;

interface Agent {
  id: string;
  name: string;
  serviceType: string;
  description: string;
  endpoint: string;
  pricePerRequest: string;
  walletAddress: string;
  stakedAmount: string;
  active: boolean;
}

function EditAgentForm({ agent, address }: { agent: Agent; address: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: agent.name || "",
    description: agent.description || "",
    endpoint: agent.endpoint || "",
    price: (parseInt(agent.pricePerRequest || "0") / 1000000).toString(),
  });

  const [updateAgent, { loading: updating }] = useMutation(UPDATE_AGENT);

  const hasChanges = useMemo(() => {
    const priceInUsdc = parseInt(agent.pricePerRequest || "0") / 1000000;
    return (
      formData.name !== (agent.name || "") ||
      formData.description !== (agent.description || "") ||
      formData.endpoint !== (agent.endpoint || "") ||
      formData.price !== priceInUsdc.toString()
    );
  }, [formData, agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !agent) return;

    try {
      await updateAgent({
        variables: {
          walletAddress: address,
          name: formData.name,
          description: formData.description,
          endpoint: formData.endpoint,
          pricePerRequest: (parseFloat(formData.price) * 1000000).toString(),
        },
        refetchQueries: ["GetAgentByWallet", "GetAgents", "GetOperatorData"],
        awaitRefetchQueries: true,
      });

      toast.success("Agent updated successfully!");
    } catch (err: unknown) {
      console.error("Update failed:", err);
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Pencil className="h-7 w-7 text-primary" />
            Edit Agent
          </h1>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            agent.active
              ? "bg-green-500/10 text-green-500"
              : "bg-orange-500/10 text-orange-500"
          }`}
        >
          {agent.active ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
          <CardDescription>
            Update your agent&apos;s information. Changes are saved to the
            database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={agent.serviceType}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Service type cannot be changed after registration.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[100px] bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, endpoint: e.target.value })
                  }
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USDC)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="bg-background"
                />
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Wallet Address
                </span>
                <span className="font-mono text-xs">
                  {agent.walletAddress}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Staked Amount</span>
                <span>
                  {(parseInt(agent.stakedAmount) / 1e18).toFixed(2)} AVAX
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || updating}
                className="flex-1"
                variant="gradient"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            {!hasChanges && (
              <p className="text-center text-sm text-muted-foreground">
                No changes to save
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function EditAgentPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();

  const { data, loading, error } = useQuery<{ getAgentByWallet: Agent }>(
    GET_AGENT_BY_WALLET,
    {
      variables: { walletAddress: address || "" },
      skip: !address,
    }
  );

  const agent = data?.getAgentByWallet;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to edit your agent.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container max-w-2xl mx-auto px-4 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">No Agent Found</h2>
            <p className="text-muted-foreground">
              No agent is registered with this wallet address.
            </p>
            <Button onClick={() => router.push("/register-agent")}>
              Register an Agent
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="container max-w-2xl mx-auto px-4">
        {agent && address && <EditAgentForm agent={agent} address={address} key={agent.id} />}
      </div>
    </div>
  );
}