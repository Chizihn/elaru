"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  AlertCircle,
  Trophy,
  TrendingUp,
  Shield,
  Users,
  Activity,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { ReputationChart } from "@/components/ReputationChart";
import { useQuery } from "@apollo/client/react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { formatEther } from "ethers";
import { GET_REPUTATION_DATA } from "@/graphql/queries/agents";

interface Agent {
  id: string;
  name: string;
  serviceType: string;
  reputationScore: number;
  walletAddress: string;
  stakedAmount: string;
  pricePerRequest: string;
}

interface ReputationHistoryPoint {
  date: string;
  score: number;
}

interface GetReputationDataQuery {
  getAgents: Agent[];
  getTotalNetworkVolume: number;
  getReputationHistory: ReputationHistoryPoint[];
}

export default function ReputationExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, loading, error, refetch, fetchMore } =
    useQuery<GetReputationDataQuery>(GET_REPUTATION_DATA, {
      variables: { skip: 0, take: pageSize },
    });

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    await fetchMore({
      variables: { skip: nextPage * pageSize, take: pageSize },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          getAgents: [...prev.getAgents, ...fetchMoreResult.getAgents],
        };
      },
    });
    setPage(nextPage);
  };

  const filteredAgents = useMemo(() => {
    return (data?.getAgents || [])
      .filter((agent) => {
        const query = searchQuery.toLowerCase();
        const type = agent.serviceType?.toLowerCase() || "";
        const wallet = agent.walletAddress?.toLowerCase() || "";
        return type.includes(query) || wallet.includes(query);
      })
      .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0));
  }, [data?.getAgents, searchQuery]);

  const totalStaked = useMemo(() => {
    return (data?.getAgents || []).reduce((acc, agent) => {
      try {
        return acc + parseFloat(formatEther(agent.stakedAmount));
      } catch {
        return acc;
      }
    }, 0);
  }, [data?.getAgents]);

  const chartData =
    data?.getReputationHistory?.map((p) => ({
      date: p.date,
      score: p.score,
    })) || [];

  const currentScore = chartData[chartData.length - 1]?.score || 0;
  const previousScore = chartData[chartData.length - 2]?.score || 0;
  const scoreChange = currentScore - previousScore;
  const scoreChangePercent = previousScore
    ? ((scoreChange / previousScore) * 100).toFixed(2)
    : 0;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-6 bg-card border border-destructive/20 rounded-2xl shadow-2xl">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive w-fit mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Failed to load data</h2>
          <p className="text-muted-foreground">
            We encountered an error while fetching the latest network stats.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-background to-background text-foreground">
      <div className="container mx-auto py-8 space-y-12 px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-md">
            <Activity className="h-4 w-4 animate-pulse" />
            Live Network Data
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-white to-white/60">
            Reputation Explorer
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time trust metrics and validator attestations across the
            decentralized Elaru agent network.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: "Total Agents", value: (data?.getAgents || []).length, icon: Users },
            {
              label: "Total Staked",
              value: `${totalStaked.toFixed(2)} AVAX`,
              icon: Shield,
            },
            {
              label: "Network Volume",
              value: `$${data?.getTotalNetworkVolume?.toLocaleString() || "0"}`,
              icon: TrendingUp,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card border-3 border-border hover:border-primary transition-all group">
                <CardHeader className="pb-4 border-b-3 border-border">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <div
                      className={`p-2 border-2 border-foreground ${
                        i === 0
                          ? "bg-primary text-background"
                          : i === 1
                          ? "bg-secondary text-background"
                          : "bg-accent text-background"
                      }`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {loading && (data?.getAgents || []).length === 0 ? (
                    <Skeleton className="h-12 w-32" />
                  ) : (
                    <div className="text-4xl font-black">{stat.value}</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* NEW CHART DESIGN */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="relative overflow-hidden bg-card border-3 border-primary shadow-[12px_12px_0px_0px_rgba(0,229,229,0.2)]">
              {/* Geometric Background Pattern */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `
                  linear-gradient(45deg, hsl(var(--primary)) 25%, transparent 25%),
                  linear-gradient(-45deg, hsl(var(--secondary)) 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, hsl(var(--accent)) 75%),
                  linear-gradient(-45deg, transparent 75%, hsl(var(--primary)) 75%)
                `,
                  backgroundSize: "40px 40px",
                  backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
                }}
              />

              <CardHeader className="relative z-10 pb-6 border-b-3 border-border">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-3xl flex items-center gap-3 font-black uppercase tracking-tight">
                      <div className="p-3 bg-primary border-3 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                        <Sparkles className="h-7 w-7 text-background" />
                      </div>
                      Network Trust Index
                    </CardTitle>
                    <CardDescription className="mt-3 text-base font-medium">
                      Aggregate reputation score • Updated every 6 hours
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="px-6 py-3 bg-accent text-accent-foreground border-3 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] mb-2">
                      <div className="text-5xl font-black">
                        {currentScore.toFixed(2)}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 justify-end ${
                        scoreChange >= 0 ? "text-accent" : "text-destructive"
                      }`}
                    >
                      <span className="text-2xl">
                        {scoreChange >= 0 ? "↑" : "↓"}
                      </span>
                      {Math.abs(Number(scoreChangePercent))}%
                      <span className="text-muted-foreground text-xs">
                        vs last
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 pt-8 pb-8">
                <div className="h-96 w-full bg-background/50 border-3 border-border p-6">
                  {loading && !data ? (
                    <Skeleton className="h-full w-full" />
                  ) : chartData.length > 0 ? (
                    <ReputationChart data={chartData} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground font-bold uppercase">
                        No historical data available yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Agents List */}
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by type or wallet..."
                className="pl-12 h-14 bg-card/40 border-white/10 focus:border-primary/50 rounded-2xl backdrop-blur-md text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Card className="bg-card border-3 border-border shadow-[8px_8px_0px_0px_rgba(0,229,229,0.15)] flex flex-col h-[680px]">
              <CardHeader className="border-b-3 border-border bg-secondary/10">
                <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                  <div className="p-2 bg-accent border-3 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
                    <Trophy className="h-6 w-6 text-background" />
                  </div>
                  Leaderboard
                </CardTitle>
              </CardHeader>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-3 text-xs text-muted-foreground border-b border-white/5">
                  Showing {filteredAgents.length} of {(data?.getAgents || []).length} agents
                </div>

                {loading && (data?.getAgents || []).length === 0 ? (
                  <div className="space-y-4 p-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredAgents.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {filteredAgents.map((agent, idx) => (
                      <div
                        key={agent.id}
                        className="p-5 hover:bg-white/5 transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-offset-2 ring-offset-background ${
                              idx === 0
                                ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/50"
                                : idx === 1
                                ? "bg-gray-400/20 text-gray-300 ring-gray-400/50"
                                : idx === 2
                                ? "bg-orange-600/20 text-orange-400 ring-orange-600/50"
                                : "bg-white/10 text-muted-foreground ring-white/20"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold group-hover:text-primary transition-colors">
                              {agent.name || agent.serviceType}
                            </p>
                            <div className="text-xs text-muted-foreground font-mono flex gap-2 mt-1">
                              <span className="bg-white/10 px-2 py-0.5 rounded">
                                {agent.serviceType}
                              </span>
                              <span>
                                {agent.walletAddress.slice(0, 8)}...
                                {agent.walletAddress.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-block px-3 py-1.5 bg-green-500/10 text-green-400 font-bold rounded-full border border-green-500/30">
                            {agent.reputationScore.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>No agents match your search</p>
                  </div>
                )}
              </div>

              {filteredAgents.length >= pageSize * (page + 1) && (
                <div className="p-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleLoadMore}
                  >
                    Load More <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
