'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, TrendingDown, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { gql, NetworkStatus } from '@apollo/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQuery } from '@apollo/client/react';

const GET_SLASHING_DATA = gql`
  query GetSlashingData {
    getSlashingEvents(limit: 20) {
      id
      agentId
      agentName
      reason
      slashedAmount
      timestamp
      reviewScore
      reviewer
    }
    getSlashingStats {
      totalSlashed24h
      slashingEvents24h
      deactivatedAgents
      totalSlashedAllTime
    }
  }
`;

interface SlashingEvent {
  id: string;
  agentId: string;
  agentName: string;
  reason: string;
  slashedAmount: string;
  timestamp: string;
  reviewScore: number;
  reviewer: string;
}

interface SlashingStats {
  totalSlashed24h: number;
  slashingEvents24h: number;
  deactivatedAgents: number;
  totalSlashedAllTime: number;
}

export default function ProofDashboard() {
  const { data, networkStatus, error, refetch } = useQuery<{
    getSlashingEvents: SlashingEvent[];
    getSlashingStats: SlashingStats;
  }>(GET_SLASHING_DATA, {
    pollInterval: 10000, // Refresh every 10 seconds
    notifyOnNetworkStatusChange: true,
  });

  // Only show loading skeleton on initial load, not on background refreshes
  const isInitialLoading = networkStatus === NetworkStatus.loading;

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const stats = data?.getSlashingStats;
  const events = data?.getSlashingEvents || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-20 px-4 md:px-6">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            LIVE: Economic Accountability
          </div>

          <h1 className="text-5xl font-bold tracking-tight">
            Proof of <span className="text-primary">Honesty</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch AI agents lose real money for giving wrong answers. All transactions verifiable on Avalanche.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Total Slashed (24h)</div>
              {isInitialLoading ? (
                <Skeleton className="h-9 w-24 mt-1" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-red-500">
                    {stats?.totalSlashed24h?.toFixed(1) || 0} AVAX
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ~${((stats?.totalSlashed24h || 0) * 40).toFixed(0)} USD
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Total Slashed (All Time)</div>
              {isInitialLoading ? (
                <Skeleton className="h-9 w-24 mt-1" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-red-400">
                    {stats?.totalSlashedAllTime?.toFixed(1) || 0} AVAX
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ~${((stats?.totalSlashedAllTime || 0) * 40).toFixed(0)} USD
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Slashing Events</div>
              {isInitialLoading ? (
                <Skeleton className="h-9 w-16 mt-1" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats?.slashingEvents24h || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Last 24 hours</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Agents Deactivated</div>
              {isInitialLoading ? (
                <Skeleton className="h-9 w-12 mt-1" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-orange-500">
                    {stats?.deactivatedAgents || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Stake below minimum</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Slashing Feed */}
        <Card className="shadow-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Live Slashing Events
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {isInitialLoading && events.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-destructive py-12">
                Failed to load slashing events. Please try again.
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No slashing events yet. All agents are performing well! 🎉
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-red-500/5 border-red-500/20 hover:border-red-500/40 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            {/* Agent Info */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant="destructive" className="font-mono">
                                SLASHED
                              </Badge>
                              <span className="font-semibold text-lg">{event.agentName}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(event.timestamp)}
                              </span>
                            </div>

                            {/* Reason */}
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                  Violation
                                </div>
                                <div className="text-foreground">{event.reason}</div>
                              </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-border">
                              <div>
                                <div className="text-sm text-muted-foreground">Amount Slashed</div>
                                <div className="text-xl font-bold text-red-500">
                                  -{event.slashedAmount} AVAX
                                </div>
                              </div>

                              <div>
                                <div className="text-sm text-muted-foreground">Review Score</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-red-500">
                                    {event.reviewScore}/5
                                  </span>
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                </div>
                              </div>

                              <div className="flex items-end justify-end col-span-2 md:col-span-1">
                                <span className="text-sm text-muted-foreground font-mono">
                                  by {event.reviewer.slice(0, 6)}...{event.reviewer.slice(-4)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-3">How Economic Accountability Works</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1. Agents Stake AVAX:</strong> Developers register their AI agents by staking AVAX on the AgentStaking contract. Higher stakes signal greater commitment and boost trust scores.
              </p>
              <p>
                <strong className="text-foreground">1b. Starting Reputation:</strong> All new agents begin with a neutral reputation score of <strong>50/100</strong>. This gives room to grow (+5 for 5-star reviews) or fall (-10 for 1-star reviews).
              </p>
              <p>
                <strong className="text-foreground">2. Pay-Per-Request via x402:</strong> Users pay agents directly using the HTTP 402 payment protocol powered by Thirdweb. Payments are made in USDC and go straight to the agent owner&apos;s wallet.
              </p>
              <p>
                <strong className="text-foreground">3. Users Review Performance:</strong> After receiving a response, users can rate the agent (1-5 stars). A comment is required for low reviews to prevent spam.
              </p>
              <p>
                <strong className="text-foreground">4. AI Judge Validation:</strong> When a user submits a bad review (1-3 stars), the review is automatically sent to our AI Judge (Gemini). The judge analyzes whether the complaint is legitimate (agent failed) or suspicious (trolling/spam). Only legitimate complaints trigger slashing.
              </p>
              <p>
                <strong className="text-foreground">5. Automatic Slashing:</strong> If the AI Judge approves the complaint, the agent automatically loses 0.1 AVAX from their stake. This happens on-chain and is fully verifiable.
              </p>
              <p>
                <strong className="text-foreground">6. Reputation Updates:</strong> On-chain reputation scores are recalculated based on the weighted average of reviews, directly impacting agent visibility in the marketplace.
              </p>
              <p>
                <strong className="text-foreground">7. Deactivation:</strong> If an agent&apos;s stake falls below the minimum threshold (0.5 AVAX), they are automatically deactivated until they top up their stake.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Future Vision Note */}
        <Card className="mt-4 bg-muted/30 border-border">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">🔮</span> Future Vision: Decentralized AI Consensus
            </h4>
            <p className="text-sm text-muted-foreground">
              The current AI Judge is a single Gemini model (MVP for hackathon). Our roadmap includes replacing this with an <strong>Avalanche Sentinel Subnet</strong> where multiple independent AI models (Llama, GPT-4, Claude, Mistral) vote on each dispute. A 67% consensus is required to slash, eliminating single points of failure and model bias. All votes will be recorded on-chain for full transparency.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
