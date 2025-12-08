"use client";

import { useState } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Gavel,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { GET_DISPUTES, VOTE_ON_DISPUTE } from "@/graphql/dispute";

interface Vote {
  validator: string;
}

interface Agent {
  serviceType: string;
  walletAddress: string;
}

interface Task {
  description: string;
  agent: Agent;
  paymentStatus: string;
}

interface Dispute {
  id: string;
  status: string;
  createdAt: string;
  raisedBy: string;
  reason: string;
  votes: Vote[];
  task: Task;
}

interface GetDisputesData {
  getAllDisputes: Dispute[];
}

export default function ValidatorDashboard() {
  const { isConnected, address } = useAccount();
  const { data, networkStatus, refetch } = useQuery<GetDisputesData>(
    GET_DISPUTES,
    {
      pollInterval: 10000,
      notifyOnNetworkStatusChange: true,
    }
  );

  const [voteOnDispute] = useMutation(VOTE_ON_DISPUTE);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const isInitialLoading = networkStatus === NetworkStatus.loading;

  if (!isConnected) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground ">Validator Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">
          Please connect your wallet to access the validator dashboard and
          participate in dispute resolution.
        </p>
      </div>
    );
  }

  const disputes = data?.getAllDisputes || [];

  const handleVote = async (disputeId: string, approveRefund: boolean) => {
    if (!address) return;

    setVotingId(disputeId);
    try {
      await voteOnDispute({
        variables: {
          disputeId,
          validator: address,
          approveRefund,
          comment: comment || null,
        },
        refetchQueries: ["GetDisputes"],
        awaitRefetchQueries: true,
      });

      toast.success(
        `Vote submitted: ${
          approveRefund ? "Refund Approved" : "Release to Agent"
        }`
      );
      setComment("");
      refetch();
    } catch (error: unknown) {
      console.error("Voting error:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to submit vote");
      } else {
        toast.error("An unknown error occurred while submitting the vote.");
      }
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl text-primary font-bold flex items-center gap-2">
            <Gavel className="h-8 w-8 text-primary" />
            Validator Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review disputes and vote on resolutions
          </p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-lg text-sm border border-primary/20">
          Validator Status:{" "}
          <span className="text-green-600 font-bold ml-1">Active</span>
        </div>
      </div>

      <div className="grid gap-6">
        {isInitialLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : disputes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no active disputes requiring your attention at this
                time.
              </p>
            </CardContent>
          </Card>
        ) : (
          disputes.map((dispute: Dispute) => {
            const hasVoted = dispute.votes.some(
              (v: Vote) => v.validator.toLowerCase() === address?.toLowerCase()
            );

            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden border-border shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          Dispute #{dispute.id.substring(0, 8)}
                          <Badge
                            variant={
                              dispute.status === "VOTING"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              dispute.status === "VOTING"
                                ? "bg-blue-500 hover:bg-blue-600"
                                : ""
                            }
                          >
                            {dispute.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Raised{" "}
                          {formatDistanceToNow(new Date(dispute.createdAt), {
                            addSuffix: true,
                          })}{" "}
                          by
                          <span className="font-mono text-xs ml-1 bg-muted px-1 py-0.5 rounded">
                            {dispute.raisedBy.substring(0, 6)}...
                          </span>
                        </CardDescription>
                      </div>
                      <div className="text-right text-sm font-medium">
                        <span className="text-muted-foreground mr-2">
                          Votes:
                        </span>
                        <span className="bg-background px-2 py-1 rounded border shadow-sm">
                          {dispute.votes.length} / 2 required
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" /> Dispute Reason
                          </h3>
                          <div className="p-4 bg-red-50/50 border border-red-100 dark:border-red-900/30 dark:bg-red-900/10 rounded-lg text-sm text-red-900 dark:text-red-200 leading-relaxed">
                            {dispute.reason}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                            Task Details
                          </h3>
                          <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-3 border">
                            <div>
                              <span className="font-medium block mb-1">
                                Description:
                              </span>
                              <p className="text-muted-foreground">
                                {dispute.task.description}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
                              <div>
                                <span className="font-medium block mb-1">
                                  Agent:
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {dispute.task.agent.serviceType}
                                  </span>
                                  <span className="text-xs font-mono bg-background px-1 rounded border">
                                    {dispute.task.agent.walletAddress.substring(
                                      0,
                                      4
                                    )}
                                    ...
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="font-medium block mb-1">
                                  Payment Status:
                                </span>
                                <Badge variant="outline">
                                  {dispute.task.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-l pl-8 border-border/50">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          Cast Your Vote
                        </h3>

                        {hasVoted ? (
                          <div className="p-6 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg flex flex-col items-center text-center gap-3 text-green-800 dark:text-green-200">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <CheckCircle className="h-6 w-6" />
                            </div>
                            <p className="font-medium">
                              You have voted on this dispute.
                            </p>
                            <p className="text-xs opacity-80">
                              Your decision has been recorded on-chain.
                            </p>
                          </div>
                        ) : dispute.status !== "VOTING" &&
                          dispute.status !== "RAISED" ? (
                          <div className="p-6 bg-muted rounded-lg text-center text-muted-foreground">
                            This dispute has been resolved.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Optional reasoning for your decision..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="resize-none min-h-[100px]"
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <Button
                                variant="outline"
                                className="h-auto py-4 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-900/20"
                                onClick={() => handleVote(dispute.id, true)}
                                disabled={!!votingId}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  {votingId === dispute.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <AlertTriangle className="h-5 w-5 mb-1" />
                                  )}
                                  <span className="font-semibold">
                                    Approve Refund
                                  </span>
                                  <span className="text-xs font-normal opacity-70">
                                    Slash Agent
                                  </span>
                                </div>
                              </Button>

                              <Button
                                variant="outline"
                                className="h-auto py-4 border-green-200 hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:border-green-900/50 dark:hover:bg-green-900/20"
                                onClick={() => handleVote(dispute.id, false)}
                                disabled={!!votingId}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  {votingId === dispute.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-5 w-5 mb-1" />
                                  )}
                                  <span className="font-semibold">
                                    Release to Agent
                                  </span>
                                  <span className="text-xs font-normal opacity-70">
                                    Reject Dispute
                                  </span>
                                </div>
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              This action will record your vote on-chain via the
                              ValidationRegistry contract.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
