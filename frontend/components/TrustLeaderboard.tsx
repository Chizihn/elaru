"use client";

import { useQuery } from "@apollo/client/react";
import { NetworkStatus } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award } from "lucide-react";
import { GET_TOP_AGENTS } from "@/graphql/queries/agents";

interface Agent {
  id: string;
  serviceType: string;
  reputationScore: number;
  walletAddress: string;
}

interface GetTopAgentsData {
  getTopAgents: Agent[];
}

export function TrustLeaderboard() {
  const { data, networkStatus } = useQuery<GetTopAgentsData>(GET_TOP_AGENTS, {
    variables: { limit: 10 },
    pollInterval: 10000, // Refresh every 10 seconds
    notifyOnNetworkStatusChange: true,
  });

  // Only show loading skeleton on initial load, not on background refreshes
  const isInitialLoading = networkStatus === NetworkStatus.loading;
  const agents: Agent[] = data?.getTopAgents || [];

  if (isInitialLoading && agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Trusted Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-linear-to-br from-card to-secondary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          🏆 Top Trusted Agents
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Live rankings updated every 10 seconds
        </p>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No agents registered yet</p>
            <p className="text-sm">Be the first to join the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              const medal = index < 3 ? medals[index] : `#${index + 1}`;

              return (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-8">{medal}</span>
                    <div>
                      <p className="font-semibold">{agent.serviceType}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.walletAddress.substring(0, 6)}...
                        {agent.walletAddress.substring(38)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <Badge variant="secondary" className="text-lg px-3">
                      {Math.floor(agent.reputationScore)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
