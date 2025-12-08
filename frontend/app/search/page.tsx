"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { TrustedAgentList } from "@/components/TrustedAgentList";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { FIND_AGENTS } from "@/graphql/queries/agents";
import { Agent } from "@/types/agent";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialMinTrust = parseInt(searchParams.get("minTrust") || "70");

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [minTrust] = useState(initialMinTrust);

  const { data, loading, error } = useQuery<{
    findAgentsForTask: Agent[];
  }>(FIND_AGENTS, {
    variables: {
      taskDescription: initialQuery,
      minTrustScore: initialMinTrust,
    },
    skip: !initialQuery,
  });

  // Update local state when URL params change
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(searchQuery)}&minTrust=${minTrust}`
      );
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    const task = searchParams.get("q");
    router.push(
      `/agent/${agent.id}${task ? `?task=${encodeURIComponent(task)}` : ""}`
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10">
      <div className="container max-w-5xl mx-auto space-y-8">
        {/* Search Header */}
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">Find an Agent</h1>

          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe your task (e.g., 'I need a weather forecast for London' or 'Analyze the sentiment of this text')..."
                className="pl-10 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              Search
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="pt-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Error loading agents: {error.message}
            </div>
          ) : (
            <TrustedAgentList
              agents={data?.findAgentsForTask || []}
              onSelectAgent={handleSelectAgent}
              searchQuery={initialQuery}
            />
          )}
        </div>
      </div>
    </div>
  );
}
