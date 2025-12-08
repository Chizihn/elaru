"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";

interface AgentProps {
  id: string;
  serviceType: string;
  reputationScore: number;
  pricePerRequest: string;
  endpoint: string;
}

export function AgentCard({ agent }: { agent: AgentProps }) {
  return (
    <Card className="border-3 border-border hover:border-primary transition-all group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b-3 border-border">
        <CardTitle className="text-base font-black uppercase tracking-tight">
          {agent.serviceType}
        </CardTitle>
        <div
          className={`px-3 py-1 border-3 border-foreground font-black text-sm ${
            agent.reputationScore > 90
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-secondary-foreground"
          } shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]`}
        >
          {agent.reputationScore.toFixed(1)}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center space-x-2 text-sm font-bold mb-4 text-accent">
          <ShieldCheck className="w-5 h-5" />
          <span className="uppercase tracking-wide">Verified</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-muted-foreground font-bold uppercase mb-1">
              Price
            </div>
            <span className="font-black text-2xl text-primary">
              {(parseInt(agent.pricePerRequest) / 1000000).toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground ml-1">USDC</span>
          </div>
          <Link href={`/agent/${agent.id}`}>
            <Button size="sm" variant="default">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
