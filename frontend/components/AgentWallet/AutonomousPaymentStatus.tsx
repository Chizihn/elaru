"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
} from "lucide-react";
import { formatUSDCAmount } from "@/lib/agent-wallet";

export interface AutonomousPayment {
  id: string;
  targetAgent: string;
  targetAgentName?: string;
  amount: number;
  status: "pending" | "success" | "error";
  timestamp: Date;
  txHash?: string;
}

interface AutonomousPaymentStatusProps {
  payments: AutonomousPayment[];
  isProcessing: boolean;
  className?: string;
}

export function AutonomousPaymentStatus({
  payments,
  isProcessing,
  className = "",
}: AutonomousPaymentStatusProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest payment
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [payments]);

  const pendingCount = payments.filter(p => p.status === "pending").length;
  const successCount = payments.filter(p => p.status === "success").length;
  const totalSpent = payments
    .filter(p => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  if (payments.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-5 w-5 text-primary" />
            {isProcessing && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-yellow-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium text-foreground">
            Autonomous Payments
          </span>
        </div>
        
        {successCount > 0 && (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <Zap className="h-3 w-3 mr-1" />
            {formatUSDCAmount(totalSpent)} spent
          </Badge>
        )}
      </div>

      {/* Payment List */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                payment.status === "pending"
                  ? "bg-yellow-500/5 border-yellow-500/20"
                  : payment.status === "success"
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              {/* Status Icon */}
              <div className="shrink-0">
                {payment.status === "pending" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                ) : payment.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* Payment Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Paying</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-foreground truncate">
                    {payment.targetAgentName || payment.targetAgent.slice(0, 8)}
                  </span>
                </div>
                {payment.txHash && (
                  <a
                    href={`https://testnet.snowtrace.io/tx/${payment.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline"
                  >
                    View transaction →
                  </a>
                )}
              </div>

              {/* Amount */}
              <div className="shrink-0 text-right">
                <span className={`text-sm font-medium ${
                  payment.status === "success" ? "text-green-500" : "text-foreground"
                }`}>
                  {formatUSDCAmount(payment.amount)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Processing Indicator */}
      {isProcessing && pendingCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.1s]" />
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
          <span>Processing autonomous payments...</span>
        </div>
      )}
    </div>
  );
}

export default AutonomousPaymentStatus;
