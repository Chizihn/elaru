"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  History,
  Star,
} from "lucide-react";
import { ErrorState } from "@/components/ui/state/ErrorState";
import { EmptyState } from "@/components/ui/state/EmptyState";
import { DisputeModal } from "@/components/DisputeModal";
import { ReviewModal } from "@/components/ReviewModal";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@apollo/client/react";
import { NetworkStatus } from "@apollo/client";
import { GET_USER_TASKS } from "@/graphql/queries/task";

interface Task {
  id: string;
  description: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  paymentStatus?: string | null;
  paymentTxHash?: string | null;
  reviewScore?: number | null;
  disputeStatus?: string | null;
  result?: string | null;
  agent?: {
    id: string;
    serviceType: string;
    walletAddress: string;
  } | null;
}

interface GetUserTasksData {
  getUserTasks: Task[];
}

export default function HistoryPage() {
  const { isConnected, address } = useAccount();
  const { data, networkStatus, error } = useQuery<GetUserTasksData>(GET_USER_TASKS, {
    skip: !isConnected,
    pollInterval: 5000,
    notifyOnNetworkStatusChange: true,
  });

  // Only show loading skeleton on initial load, not on background refreshes
  const isInitialLoading = networkStatus === NetworkStatus.loading;

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [resultTask, setResultTask] = useState<Task | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [reviewTaskForHistory, setReviewTaskForHistory] = useState<Task | null>(
    null
  );

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <History className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Task History</h2>
        <p className="text-muted-foreground max-w-md">
          Please connect your wallet to view your past requests and manage
          disputes.
        </p>
      </div>
    );
  }

  // GraphQL error
  if (error) {
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  }

  const tasks = data?.getUserTasks || [];

  const getStatusBadge = (status: string, disputeStatus?: string | null) => {
    if (disputeStatus && disputeStatus !== "NONE") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> DISPUTED
        </Badge>
      );
    }

    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 gap-1">
            <CheckCircle2 className="h-3 w-3" /> COMPLETED
          </Badge>
        );
      case "PENDING":
      case "ASSIGNED":
      case "PROCESSING":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> IN PROGRESS
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> FAILED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRaiseDispute = (taskId: string) => {
    setSelectedTask(taskId);
    setIsDisputeModalOpen(true);
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Task History</h1>
        <p className="text-muted-foreground">
          View your past requests and manage disputes
        </p>
      </div>

      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>
            A complete log of your interactions with Elaru agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInitialLoading && !data ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              title="No Tasks Found"
              description="You haven't submitted any tasks yet. Start by exploring agents and submitting a request."
              actionLabel="Explore Agents"
              onAction={() => (window.location.href = "/reputation")}
            />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[600px] sm:min-w-0 px-4 sm:px-0">
                <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Description</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium max-w-[300px]">
                        <div className="truncate" title={task.description}>
                          {task.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.agent ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {task.agent.serviceType}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {task.agent.walletAddress.substring(0, 6)}...
                              {task.agent.walletAddress.slice(-4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Pending assignment
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status, task.disputeStatus)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(task.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* Raise Dispute */}
                        {task.status === "COMPLETED" &&
                          (!task.disputeStatus ||
                            task.disputeStatus === "NONE") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRaiseDispute(task.id)}
                            >
                              Raise Dispute
                            </Button>
                          )}

                        {/* Active Dispute */}
                        {task.disputeStatus &&
                          task.disputeStatus !== "NONE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="opacity-50"
                            >
                              Dispute Active
                            </Button>
                          )}

                        {/* Leave Review */}
                        {task.status === "COMPLETED" &&
                          !task.reviewScore &&
                          task.agent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                              onClick={() => setReviewTaskForHistory(task)}
                            >
                              <Star className="h-3 w-3 mr-1" /> Rate
                            </Button>
                          )}

                        {/* View Result */}
                        {task.result && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResultTask(task);
                              setIsResultModalOpen(true);
                            }}
                          >
                            View Result
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        taskId={selectedTask || ""}
        userAddress={address || ""}
      />

      {/* Result Modal */}
      {resultTask && (
        <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Task Result</DialogTitle>
              <DialogDescription>
                Output from {resultTask.agent?.serviceType || "Agent"}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 prose dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4">
              <ReactMarkdown
                components={{
                  img: ({ node, ...props }) => (
                    <img {...props} className="max-w-full h-auto rounded-lg shadow-md" loading="lazy" />
                  ),
                }}
              >
                {resultTask.result || "*No result content*"}
              </ReactMarkdown>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Modal */}
      {reviewTaskForHistory && reviewTaskForHistory.agent && (
        <ReviewModal
          task={{
            id: reviewTaskForHistory.id,
            paymentTxHash: reviewTaskForHistory.paymentTxHash || "0x...",
            agent: {
              id: reviewTaskForHistory.agent.id,
              serviceType: reviewTaskForHistory.agent.serviceType,
            },
          }}
          onClose={() => setReviewTaskForHistory(null)}
          onSubmit={() => setReviewTaskForHistory(null)}
        />
      )}
    </div>
  );
}
