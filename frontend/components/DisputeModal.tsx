"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RAISE_DISPUTE } from "@/graphql/dispute";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  userAddress: string;
}

export function DisputeModal({
  isOpen,
  onClose,
  taskId,
  userAddress,
}: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [raiseDispute, { loading }] = useMutation(RAISE_DISPUTE);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    try {
      await raiseDispute({
        variables: {
          taskId,
          reason: reason.trim(),
          raisedBy: userAddress,
        },
        refetchQueries: ["GetUserTasks", "GetDisputes"],
        awaitRefetchQueries: true,
      });

      toast.success(
        "Dispute raised successfully! Validators will review your case."
      );
      setReason("");
      onClose();
    } catch (error: unknown) {
      console.error("Error raising dispute:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to raise dispute");
      } else {
        toast.error("An unknown error occurred while raising the dispute.");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // Prevent closing while loading
      if (!loading) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Raise Dispute
          </DialogTitle>
          <DialogDescription>
            If the task was not completed satisfactorily, you can request a
            refund. Validators will review your case and vote on the outcome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Dispute Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you're requesting a refund (e.g., task not completed, poor quality, incorrect results...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific and provide details. This will help validators make a
              fair decision.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">How it works:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Your dispute is submitted to validators</li>
              <li>Validators review the case and vote (refund or release)</li>
              <li>2 validators needed to reach a decision</li>
              <li>If approved, payment is refunded to you</li>
              <li>If rejected, payment is released to the agent</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reason.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
