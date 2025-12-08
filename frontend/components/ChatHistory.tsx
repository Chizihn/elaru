/**
 * ChatHistory Component
 * 
 * Displays past interactions with the current agent.
 * Uses state management for selected chat with close functionality.
 */

"use client";

import { useQuery } from "@apollo/client/react";
import { NetworkStatus, gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Clock,
  ChevronRight,
  History,
  Star,
  PanelLeftClose,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// GraphQL query for agent-specific history
const GET_AGENT_HISTORY = gql`
  query GetAgentHistory($agentId: String!) {
    getAgentHistory(agentId: $agentId) {
      id
      description
      result
      status
      createdAt
      completedAt
      reviewScore
      paymentTxHash
    }
  }
`;

export interface HistoryTask {
  id: string;
  description: string;
  result: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  reviewScore: number | null;
  paymentTxHash: string | null;
}

interface ChatHistoryProps {
  agentId: string;
  onSelectChat: (task: HistoryTask) => void;
  selectedChatId: string | null;
  onClearSelection: () => void;
  onToggleVisibility: () => void;
}

export function ChatHistory({
  agentId,
  onSelectChat,
  selectedChatId,
  onClearSelection,
  onToggleVisibility,
}: ChatHistoryProps) {
  const { data, networkStatus } = useQuery<{
    getAgentHistory: HistoryTask[];
  }>(GET_AGENT_HISTORY, {
    variables: { agentId },
    skip: !agentId,
    pollInterval: 15000,
    notifyOnNetworkStatusChange: true,
  });

  const isLoading = networkStatus === NetworkStatus.loading;
  const tasks = data?.getAgentHistory || [];

  return (
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-xl border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Chat History</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggleVisibility}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Chat Banner */}
      <AnimatePresence>
        {selectedChatId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-primary/10 border-b border-primary/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary font-medium">
                Viewing past chat
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary hover:text-primary"
                onClick={onClearSelection}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading && tasks.length === 0 ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : tasks.length === 0 ? (
            // Empty state
            <div className="text-center py-8 px-4">
              <div className="p-3 rounded-full bg-muted mx-auto w-fit mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No chat history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your conversations will appear here
              </p>
            </div>
          ) : (
            // History items
            tasks.map((task) => (
              <motion.button
                key={task.id}
                onClick={() => onSelectChat(task)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedChatId === task.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Description preview */}
                    <p className="text-sm font-medium truncate text-foreground">
                      {task.description}
                    </p>
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(task.createdAt), {
                        addSuffix: true,
                      })}
                    </div>

                    {/* Review score badge */}
                    {task.reviewScore && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {task.reviewScore}/5
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>

                {/* Status badge */}
                <Badge
                  variant={task.status === "COMPLETED" ? "default" : "secondary"}
                  className="mt-2 text-[10px] px-1.5 py-0"
                >
                  {task.status}
                </Badge>
              </motion.button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          {tasks.length} conversation{tasks.length !== 1 ? "s" : ""} with this agent
        </p>
      </div>
    </div>
  );
}
