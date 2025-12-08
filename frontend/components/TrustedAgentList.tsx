'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { StakeBadge } from '@/components/StakeBadge';
import { Agent } from '@/types/agent';

interface TrustedAgentListProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  searchQuery?: string;
}

export function TrustedAgentList({ agents, onSelectAgent, searchQuery }: TrustedAgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No agents found matching &quot;{searchQuery || 'your criteria'}&quot;.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {searchQuery ? `Results for '${searchQuery}'` : 'Top Trusted Agents'}
      </h2>
      <div className="grid gap-4">
        {agents.map((agent, index) => {
          // Mock data for demo
          // Deterministic stats based on ID to avoid hydration mismatch and random changes
          // Use real stats from backend
          const successRate = agent.successRate ? Math.round(agent.successRate) : 0;
          // We don't have avgRating in backend yet, so we can hide it or keep it deterministic for now
          const avgRating = (agent.reputationScore / 20).toFixed(1); // Derive 5-star rating from reputation (0-100)
          const completed = agent.completedTasksCount || 0;
          const validated = (agent.validationCount || 0) > 0;
          const priceInUSDC = (parseFloat(agent.pricePerRequest || '0') / 1000000).toFixed(3);

          return (
            <Card key={agent.id} className="bg-card/50 hover:bg-card/80 transition-all border-2 hover:border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🤖'}</span>
                        <h3 className="text-xl font-bold">{agent.serviceType}</h3>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {agent.serviceType.split(' ')[0]}
                      </Badge>
                      <StakeBadge 
                        stakedAmount={agent.stakedAmount || "0"} 
                        slashedAmount={agent.slashedAmount || "0"}
                        size="sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-semibold">{successRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Rating</p>
                        <p className="font-semibold">{avgRating}/5</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-semibold">{completed.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Validated</p>
                        <p className="font-semibold flex items-center gap-1">
                          {validated ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Yes
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              No
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 ml-6">
                    <div className="relative">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${agent.reputationScore * 2.51} 251`}
                          className="text-primary"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{Math.floor(agent.reputationScore)}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-lg font-bold">{priceInUSDC === 'NaN' ? '0.000' : priceInUSDC} USDC</p>
                    </div>
                    <Button
                      onClick={() => onSelectAgent(agent)}
                      className="w-full"
                      variant="gradient"
                    >
                      Select 
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
