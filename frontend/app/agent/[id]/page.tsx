"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReputationChart } from "@/components/ReputationChart";
import { ValidationHistory } from "@/components/ValidationHistory";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Star,
  Shield,
  Activity,
  MessageSquare,
  Wallet,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  DollarSign,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state/ErrorState";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { GET_AGENT_DETAILS } from "@/graphql/queries/agents";
import { StakeManagement } from "@/components/StakeManagement";
import { parseEther } from "viem";

interface Agent {
  id: string;
  name: string;
  serviceType: string;
  reputationScore: number;
  pricePerRequest: string;
  endpoint: string;
  description: string;
  walletAddress: string;
}

interface Validation {
  id: string;
  validator: string;
  isValid: boolean;
  comments: string;
  timestamp: string;
}

interface Review {
  id: string;
  reviewer: string;
  score: number;
  comment: string;
  timestamp: string;
}

interface Reputation {
  totalScore: number;
  reviewCount: number;
  feedbacks: Review[];
}

interface GetAgentDetailsQuery {
  getAgent: Agent;
  getValidations: Validation[];
  getReputation: Reputation;
  getAgentEarnings: number;
}

export default function AgentProfile() {
  const params = useParams();
  const searchParams = useSearchParams();
  const task = searchParams.get("task");
  const id = params?.id as string;
  const { address } = useAccount();

  const { data, loading, error } = useQuery<GetAgentDetailsQuery>(
    GET_AGENT_DETAILS,
    {
      variables: { id, walletAddress: address || "" },
      skip: !id,
    }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-background to-background text-foreground py-12">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          {/* Back Button Skeleton */}
          <Skeleton className="h-10 w-36 mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-10 w-full max-w-md rounded-full" />
              </div>

              {/* Reputation Chart Skeleton */}
              <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="h-[350px]">
                  <Skeleton className="h-full w-full" />
                </CardContent>
              </Card>

              {/* Validator Attestations Skeleton */}
              <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-56 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Feedback Skeleton */}
              <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full ml-10" />
                      <Separator className="mt-6 bg-white/5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Sidebar Skeleton */}
            <div className="space-y-6 lg:sticky lg:top-24 h-fit">
              <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-purple-500 to-blue-500" />
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <Separator className="bg-white/10" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  if (!data?.getAgent)
    return (
      <ErrorState
        title="Agent Not Found"
        message="The requested agent could not be found."
      />
    );

  const agent = data.getAgent;
  const validations = data.getValidations || [];
  const reputation = data.getReputation;
  const reviews = reputation?.feedbacks || [];
  const earnings = data.getAgentEarnings || 0;
  const isOwner =
    address && agent.walletAddress.toLowerCase() === address.toLowerCase();

  // Derive chart data from reviews
  const chartData = reviews
    .reduce(
      (
        acc: { date: string; score: number; count: number }[],
        review: Review
      ) => {
        const date = new Date(review.timestamp).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.score =
            (existing.score * existing.count + review.score * 20) /
            (existing.count + 1);
          existing.count += 1;
        } else {
          acc.push({ date, score: review.score * 20, count: 1 });
        }
        return acc;
      },
      []
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-background to-background text-foreground py-12">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/reputation">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary pl-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Explorer
            </Button>
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 px-3 py-1"
                >
                  {agent.serviceType}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </Badge>
              </div>
              <div className="flex-col gap-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">
                  {agent.name || agent.serviceType}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground bg-white/5 w-fit px-4 py-4 rounded-full border border-white/10">
                  <Wallet className="w-4 h-4" />
                  <span className="font-mono text-sm">
                    {agent.walletAddress}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-50 hover:opacity-100 cursor-pointer" />
                </div>
              </div>
            </motion.div>

            {/* Charts & History Grid */}
            <div className="grid grid-cols-1 gap-8">
              <motion.div variants={itemVariants}>
                <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Reputation History
                    </CardTitle>
                    <CardDescription>
                      Historical performance based on user feedback and
                      validation scores.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ReputationChart
                      data={
                        chartData.length > 0
                          ? chartData
                          : [
                              {
                                date: new Date().toISOString(),
                                score: agent.reputationScore,
                              },
                            ]
                      }
                    />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Validator Attestations
                    </CardTitle>
                    <CardDescription>
                      Cryptographically verified performance checks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ValidationHistory validations={validations} />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Recent Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review: Review) => (
                        <div key={review.id} className="group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {review.reviewer.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">
                                  {review.reviewer}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    review.timestamp
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center bg-white/5 px-2 py-1 rounded-full">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.score
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground pl-10 group-hover:text-foreground transition-colors">
                            {review.comment}
                          </p>
                          <Separator className="mt-6 bg-white/5" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No feedback available yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 h-fit">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card/30 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-purple-500 to-blue-500" />
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-muted-foreground text-sm">
                      Trust Score
                    </span>
                    <Badge className="text-lg px-3 py-1 bg-primary/20 text-primary border-primary/20 hover:bg-primary/30 transition-colors">
                      {agent.reputationScore.toFixed(1)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Price per Request
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-3xl">
                        {(parseInt(agent.pricePerRequest) / 1000000).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        USDC
                      </span>
                    </div>
                  </div>

                  {/* Owner Controls with Earnings */}
                  {isOwner && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Owner Dashboard
                        </p>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-muted-foreground text-sm">
                              Total Earnings
                            </span>
                          </div>
                          <span className="font-bold text-green-400">
                            ${earnings.toFixed(2)} USDC
                          </span>
                        </div>
                        
                        {/* Stake Management */}
                        <StakeManagement
                          agentAddress={agent.walletAddress}
                          currentStake={parseEther("0.5")}
                          onStakeUpdated={() => window.location.reload()}
                        />
                        
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            (window.location.href = "/edit-agent")
                          }
                        >
                          Edit Agent Details
                        </Button>
                      </div>
                    </>
                  )}

                  <Separator className="bg-white/10" />

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      About this Agent
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {agent.description}
                    </p>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="pt-4">
                    <Link
                      href={`/chat/${agent.id}${
                        task ? `?task=${encodeURIComponent(task)}` : ""
                      }`}
                    >
                      <Button
                        className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
                        variant="gradient"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" /> Start
                        Session
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Interact with this agent securely via Elaru Protocol
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
