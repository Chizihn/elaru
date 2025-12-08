"use client";

import { useQuery } from "@apollo/client/react";
import { NetworkStatus } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, CheckCircle2, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GET_AGENT_ANALYTICS } from "@/graphql/queries/agents";

interface Feedback {
  score: number;
  timestamp: string;
}

interface Reputation {
  feedbacks: Feedback[];
  reviewCount: number;
}

interface Agent {
  stakedAmount: string;
  slashedAmount: string;
  reputationScore: number;
}

interface AnalyticsData {
  getAgent: Agent;
  getReputation: Reputation;
}

export default function AnalyticsDashboard() {
  // Mock agent ID - in real app, get from auth context
  const agentId = "agent-1";

  const { data, networkStatus } = useQuery<AnalyticsData>(GET_AGENT_ANALYTICS, {
    variables: { agentId },
    pollInterval: 30000, // Refresh every 30 seconds
    notifyOnNetworkStatusChange: true,
  });

  // Only show loading skeleton on initial load, not on background refreshes
  const isInitialLoading = networkStatus === NetworkStatus.loading;

  if (isInitialLoading) {
    return (
      <div className="container py-20 text-center">
        <p>Loading analytics...</p>
      </div>
    );
  }

  const agent = data?.getAgent;
  const reputation = data?.getReputation;

  // Calculate metrics
  const totalEarnings = "12.5"; // Mock - would come from payment records
  const successRate = 94; // Mock - would calculate from task completion
  const totalTasks = 247; // Mock

  // Calculate trust score trend
  const feedbacks = reputation?.feedbacks || [];
  const trendData = feedbacks.slice(-10).map((f: Feedback, i: number) => ({
    name: `Review ${i + 1}`,
    score: f.score * 20, // Convert 1-5 to 0-100
    date: new Date(f.timestamp).toLocaleDateString(),
  }));

  const stakeInAvax = agent
    ? (parseFloat(agent.stakedAmount) / 1e18).toFixed(2)
    : "0";
  const slashedInAvax = agent
    ? (parseFloat(agent.slashedAmount) / 1e18).toFixed(2)
    : "0";

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your performance and earnings
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEarnings} AVAX</div>
              <p className="text-xs text-muted-foreground">
                +2.5 AVAX from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(agent?.reputationScore || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reputation?.reviewCount || 0} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Stake
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stakeInAvax} AVAX</div>
              <p className="text-xs text-red-400">
                -{slashedInAvax} AVAX slashed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trust Score Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your reputation over the last 10 reviews
            </p>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: "#14b8a6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No review data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Staking Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Stake</span>
                <span className="font-semibold">{stakeInAvax} AVAX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Slashed</span>
                <span className="font-semibold text-red-400">
                  -{slashedInAvax} AVAX
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stake</span>
                <span className="font-bold text-lg">
                  {(
                    parseFloat(stakeInAvax) - parseFloat(slashedInAvax)
                  ).toFixed(2)}{" "}
                  AVAX
                </span>
              </div>
              <div className="pt-4 border-t">
                <Badge
                  variant={
                    parseFloat(stakeInAvax) >= 5 ? "default" : "destructive"
                  }
                >
                  {parseFloat(stakeInAvax) >= 5
                    ? "✓ Active Agent"
                    : "⚠ Below Minimum Stake"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">
                    Task completed - 0.05 AVAX earned
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">5-star review received</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">
                    Stake slashed - 0.5 AVAX (low review)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">
                    Task completed - 0.08 AVAX earned
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
