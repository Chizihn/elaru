"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Wallet,
  BarChart3,
  Users,
  ArrowUpRight,
  ShieldCheck,
  History,
  Pencil,
  DollarSign,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { ErrorState } from "@/components/ui/state/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { GET_OPERATOR_DATA } from "@/graphql/queries/agents";

interface Agent {
  id: string;
  name: string;
  serviceType: string;
  reputationScore: number;
  active: boolean;
  pricePerRequest: string;
  walletAddress: string;
}

interface GetOperatorDataQuery {
  getUserAgents: Agent[];
  getTotalNetworkVolume: number;
  getAgentEarnings: number;
}

export default function OperatorDashboard() {
  const { address: walletAddress } = useAuth();
  const { data, loading, error } = useQuery<GetOperatorDataQuery>(
    GET_OPERATOR_DATA,
    {
      variables: { walletAddress: walletAddress || "" },
      skip: !walletAddress,
    }
  );

  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  const agents = data?.getUserAgents || [];
  const totalVolume = data?.getTotalNetworkVolume || 0;
  const totalEarnings = data?.getAgentEarnings || 0;

  // Calculate some derived stats
  const activeAgents = agents.filter((a) => a.active).length;
  const avgReputation =
    agents.length > 0
      ? (
          agents.reduce((acc, curr) => acc + curr.reputationScore, 0) /
          agents.length
        ).toFixed(1)
      : "0.0";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Operator/User Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your AI agents, view earnings and tasks history.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/history">
            <Button variant="neon" className="shadow-sm">
              <History className="mr-2 h-4 w-4" /> Task History
            </Button>
          </Link>
          {agents.length > 0 && (
            <Link href="/edit-agent">
              <Button variant="link" className="shadow-sm">
                <Pencil className="mr-2 h-4 w-4" /> Edit Agent
              </Button>
            </Link>
          )}
          <Link href="/register-agent">
            <Button variant="default" className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Register New Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Network Volume
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${totalVolume.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  Global Activity
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-500">
                  ${(totalEarnings / 1000000).toFixed(2)} USDC
                </div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  From your agent
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Agent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeAgents}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {agents.length} total registered
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Reputation
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{avgReputation}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your agent&apos;s score
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Agent */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle>My Agent</CardTitle>
          <CardDescription>Manage your registered service.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  variants={itemVariants}
                  className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0 hover:bg-muted/20 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">
                        {agent.name || agent.serviceType}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4 border-primary/20 text-primary/80"
                        >
                          {agent.serviceType}
                        </Badge>
                        <p className="text-sm text-muted-foreground font-mono">
                          {agent.walletAddress.substring(0, 6)}...
                          {agent.walletAddress.substring(
                            agent.walletAddress.length - 4
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">
                        {(parseInt(agent.pricePerRequest) / 1000000).toFixed(2)}{" "}
                        USDC
                      </p>
                      <p className="text-xs text-muted-foreground">Price</p>
                    </div>
                    <Badge
                      variant={agent.active ? "default" : "secondary"}
                      className={
                        agent.active
                          ? "bg-green-500/15 text-green-600 hover:bg-green-500/25"
                          : ""
                      }
                    >
                      {agent.active ? "Active" : "Inactive"}
                    </Badge>
                    <Link href={`/agent/${agent.id}`}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
              {agents.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No agents found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t registered any agents yet.
                  </p>
                  <Link href="/register-agent">
                    <Button>Register Your First Agent</Button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
