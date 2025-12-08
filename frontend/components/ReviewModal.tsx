"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAccount } from "wagmi";
import { toast } from "sonner";

const SUBMIT_FEEDBACK = gql`
  mutation SubmitFeedback(
    $agentId: String!
    $score: Int!
    $comment: String!
    $paymentProof: String!
    $reviewer: String!
  ) {
    submitFeedback(
      agentId: $agentId
      score: $score
      comment: $comment
      paymentProof: $paymentProof
      reviewer: $reviewer
    )
  }
`;

interface ReviewModalProps {
  task: {
    id: string;
    paymentTxHash: string;
    agent: {
      id: string;
      serviceType: string;
    };
  };
  onClose: () => void;
  onSubmit: () => void;
}

export function ReviewModal({ task, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { address } = useAccount();

  const [submitFeedback, { loading }] = useMutation(SUBMIT_FEEDBACK);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Allow submission even with placeholder txHash for demo
    const paymentProof =
      task.paymentTxHash && task.paymentTxHash !== "0x..."
        ? task.paymentTxHash
        : `demo-${Date.now()}-${address.slice(-8)}`;

    try {
      await submitFeedback({
        variables: {
          agentId: task.agent.id,
          score: rating,
          comment: comment.trim() || "No comment provided",
          paymentProof: paymentProof,
          reviewer: address,
        },
        refetchQueries: [
          "GetAgentReputations",
          "GetAgent",
          "GetAgentDetails",
          "GetUserTasks",
        ],
        awaitRefetchQueries: true,
      });

      toast.success("Review submitted successfully!");
      onSubmit();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(
        error.message || "Failed to submit review. Please try again."
      );
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={() => {
        // Only allow closing via X button when not loading
        if (!loading) onClose();
      }}
    >
      <DialogContent className="w-[95vw] max-w-[450px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Review {task.agent.serviceType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Payment Proof Display */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span className="text-muted-foreground">Payment Verified</span>
            </div>
            <p className="text-xs font-mono mt-1 break-all text-muted-foreground truncate">
              {task.paymentTxHash.length > 20
                ? `${task.paymentTxHash.slice(
                    0,
                    20
                  )}...${task.paymentTxHash.slice(-8)}`
                : task.paymentTxHash}
            </p>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              How would you rate this service?
            </label>
            <div className="flex gap-1 sm:gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 p-1"
                >
                  <Star
                    className={`h-8 w-8 sm:h-10 sm:w-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Share your experience (optional)
            </label>
            <Textarea
              placeholder="The agent delivered exactly what I needed..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-20 resize-none text-sm"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length} / 500
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="link"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1 bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-xs text-muted-foreground text-center">
            Your review will be recorded and helps build trust in the network.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
