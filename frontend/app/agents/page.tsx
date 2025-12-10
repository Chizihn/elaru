"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Shield,
  Zap,
  DollarSign,
  ExternalLink,
  ChevronDown,
  Users,
  Sparkles,
  Workflow,
  X,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatEther } from "ethers";
import { useWorkflowStore, WorkflowAgent, formatWorkflowPrice } from "@/lib/workflow-store";

const GET_ALL_AGENTS = gql`
  query GetAgents {
    getAgents {
      id
      name
      serviceType
      description
      endpoint
      walletAddress
      reputationScore
      pricePerRequest
      stakedAmount
      active
    }
  }
`;

interface Agent {
  id: string;
  name: string;
  serviceType: string;
  description: string;
  endpoint: string;
  walletAddress: string;
  reputationScore: number;
  pricePerRequest: string;
  stakedAmount: string;
  active: boolean;
}

// Service type options for filtering
const SERVICE_TYPES = [
  "All",
  "Weather Data",
  "Market Analysis",
  "Content Generation",
  "Code Review",
  "Data Processing",
  "Research",
  "Translation",
  "Other",
];

// Price range options
const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $0.10", min: 0, max: 100000 },
  { label: "$0.10 - $0.50", min: 100000, max: 500000 },
  { label: "$0.50 - $1.00", min: 500000, max: 1000000 },
  { label: "Over $1.00", min: 1000000, max: Infinity },
];

export default function BrowseAgentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Workflow store
  const {
    selectedAgents,
    isWorkflowMode,
    addAgent,
    removeAgent,
    clearWorkflow,
    toggleWorkflowMode,
    isAgentSelected,
    getTotalCost,
  } = useWorkflowStore();

  const { data, loading, error } = useQuery<{ getAgents: Agent[] }>(GET_ALL_AGENTS);

  const filteredAgents = useMemo(() => {
    if (!data?.getAgents) return [];

    return data.getAgents
      .filter((agent) => {
        // Search filter
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          agent.name?.toLowerCase().includes(query) ||
          agent.serviceType?.toLowerCase().includes(query) ||
          agent.description?.toLowerCase().includes(query) ||
          agent.walletAddress?.toLowerCase().includes(query);

        // Service type filter
        const matchesType =
          selectedServiceType === "All" ||
          agent.serviceType?.toLowerCase().includes(selectedServiceType.toLowerCase());

        // Price filter
        const price = parseInt(agent.pricePerRequest || "0");
        const matchesPrice =
          price >= selectedPriceRange.min && price < selectedPriceRange.max;

        return matchesSearch && matchesType && matchesPrice && agent.active;
      })
      .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0));
  }, [data?.getAgents, searchQuery, selectedServiceType, selectedPriceRange]);

  const formatPrice = (priceWei: string) => {
    const price = parseInt(priceWei || "0") / 1000000;
    return `${price.toFixed(2)}`;
  };

  const formatStake = (stakeWei: string) => {
    try {
      return `${parseFloat(formatEther(stakeWei || "0")).toFixed(2)} AVAX`;
    } catch {
      return "0 AVAX";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8 space-y-8 px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Sparkles className="h-4 w-4" />
            Browse AI Agents
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Find Your Perfect Agent
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover trusted AI agents with verified reputation scores and economic accountability.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search agents by name, type, or description..."
                className="pl-12 h-14 bg-card border-border focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              className="h-14 px-6"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-5 w-5" />
              Filters
              <ChevronDown
                className={`ml-2 h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </Button>

            {/* View Mode Toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>

            {/* Workflow Mode Toggle */}
            <Button
              variant={isWorkflowMode ? "default" : "outline"}
              className={`h-14 px-6 ${isWorkflowMode ? "bg-green-500 hover:bg-green-600" : ""}`}
              onClick={toggleWorkflowMode}
            >
              <Workflow className="mr-2 h-5 w-5" />
              {isWorkflowMode ? "Building Workflow" : "Build Workflow"}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid md:grid-cols-2 gap-4 p-4 bg-card border border-border rounded-lg"
            >
              {/* Service Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Service Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map((type) => (
                    <Badge
                      key={type}
                      variant={selectedServiceType === type ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => setSelectedServiceType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range) => (
                    <Badge
                      key={range.label}
                      variant={selectedPriceRange.label === range.label ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => setSelectedPriceRange(range)}
                    >
                      {range.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredAgents.length} of {data?.getAgents?.length || 0} agents
            </span>
            {(selectedServiceType !== "All" || selectedPriceRange.label !== "All Prices") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedServiceType("All");
                  setSelectedPriceRange(PRICE_RANGES[0]);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : ""}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Failed to load agents. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Agents Grid/List */}
        {!loading && !error && (
          <div
            className={`grid gap-6 ${
              viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            }`}
          >
            {filteredAgents.map((agent, idx) => {
              const isSelected = isAgentSelected(agent.id);
              const workflowAgent: WorkflowAgent = {
                id: agent.id,
                name: agent.name,
                serviceType: agent.serviceType,
                description: agent.description,
                endpoint: agent.endpoint,
                walletAddress: agent.walletAddress,
                reputationScore: agent.reputationScore,
                pricePerRequest: agent.pricePerRequest,
                stakedAmount: agent.stakedAmount,
              };

              const handleCardClick = (e: React.MouseEvent) => {
                if (isWorkflowMode) {
                  e.preventDefault();
                  if (isSelected) {
                    removeAgent(agent.id);
                  } else {
                    addAgent(workflowAgent);
                  }
                }
              };

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div onClick={handleCardClick}>
                    {isWorkflowMode ? (
                      <Card 
                        className={`h-full border-2 transition-all cursor-pointer group ${
                          isSelected 
                            ? "border-green-500 bg-green-500/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                className={`h-5 w-5 ${isSelected ? "bg-green-500 border-green-500" : ""}`}
                              />
                              <div className="space-y-1">
                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                  {agent.name || agent.serviceType}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {agent.serviceType}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-semibold">
                              <Shield className="h-3 w-3" />
                              {agent.reputationScore?.toFixed(1) || "0.0"}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {agent.description || "No description available."}
                          </p>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">{formatPrice(agent.pricePerRequest)}</span>
                              <span>/request</span>
                            </div>
                            {isSelected && (
                              <Badge className="bg-green-500">Added to Workflow</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Link href={`/agent/${agent.id}`}>
                        <Card className="h-full border-border hover:border-primary/50 transition-all cursor-pointer group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                  {agent.name || agent.serviceType}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {agent.serviceType}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-semibold">
                                <Shield className="h-3 w-3" />
                                {agent.reputationScore?.toFixed(1) || "0.0"}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {agent.description || "No description available."}
                            </p>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium">{formatPrice(agent.pricePerRequest)}</span>
                                <span>/request</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Zap className="h-4 w-4" />
                                <span>{formatStake(agent.stakedAmount)} staked</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <span className="text-xs text-muted-foreground font-mono">
                                {agent.walletAddress?.slice(0, 6)}...{agent.walletAddress?.slice(-4)}
                              </span>
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAgents.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">
                {data?.getAgents?.length === 0
                  ? "No agents registered yet"
                  : "No agents found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {data?.getAgents?.length === 0
                  ? "Be the first to register an AI agent on Elaru!"
                  : "Try adjusting your search or filters to find agents."}
              </p>
              {data?.getAgents?.length === 0 ? (
                <Button
                  variant="default"
                  onClick={() => window.location.href = "/register-agent"}
                >
                  Register Your Agent
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedServiceType("All");
                    setSelectedPriceRange(PRICE_RANGES[0]);
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Workflow Action Bar */}
      <AnimatePresence>
        {selectedAgents.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="border-2 border-green-500 bg-card/95 backdrop-blur-lg shadow-2xl">
              <CardContent className="p-4 flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Workflow className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {selectedAgents.length} Agent{selectedAgents.length > 1 ? "s" : ""} Selected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatWorkflowPrice(getTotalCost())}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearWorkflow}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => router.push("/workflow")}
                  >
                    Build Workflow
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
