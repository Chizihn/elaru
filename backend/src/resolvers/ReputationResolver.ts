import { Resolver, Query, Mutation, Arg, Int } from "type-graphql";
import { GraphQLError } from "graphql";
import { Reputation, Feedback } from "../entities/Reputation";
import { reputationService } from "../services/ReputationService";
import prisma from "../configs/database";
import logger from "../utils/logger";

@Resolver(Reputation)
export class ReputationResolver {
  @Query(() => Reputation, { nullable: true })
  async getReputation(@Arg("agentId", () => String) agentId: string): Promise<Reputation | null> {
    try {
      const feedbacks = await prisma.reputation.findMany({ where: { agentId } });
      
      if (feedbacks.length === 0) return null;

      const totalScore = feedbacks.reduce((acc: number, curr: any) => acc + curr.score, 0);
      const reviewCount = feedbacks.length;

      return {
        agentId,
        totalScore: Math.round(totalScore / reviewCount),
        reviewCount,
        feedbacks: feedbacks.map((f: any) => ({
          id: f.id,
          reviewer: f.reviewer,
          score: f.score,
          comment: f.comment || "",
          paymentProof: f.paymentProof,
          timestamp: f.timestamp.toISOString()
        }))
      };
    } catch (error) {
      logger.error(`ReputationResolver.getReputation failed for agent ${agentId}:`, error);
      throw new GraphQLError('Failed to fetch reputation', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => Boolean)
  async submitFeedback(
    @Arg("agentId", () => String) agentId: string,
    @Arg("score", () => Int) score: number,
    @Arg("comment", () => String, { nullable: true }) comment: string | undefined,
    @Arg("paymentProof", () => String) paymentProof: string,
    @Arg("reviewer", () => String) reviewer: string
  ): Promise<boolean> {
    try {
      // Verify payment proof (optional - can be enhanced)
      const isValid = await reputationService.verifyPaymentProof(paymentProof);
      if (!isValid) {
        logger.warn(`Invalid payment proof for feedback submission: ${paymentProof}`);
        throw new GraphQLError("Invalid payment proof format", {
          extensions: { code: 'INVALID_PAYMENT_PROOF' }
        });
      }

      // Submit feedback (includes automatic slashing if score < 3)
      await reputationService.submitFeedback(
        agentId,
        reviewer,
        score,
        comment || null,
        paymentProof
      );

      logger.info(`Feedback submitted for agent ${agentId} by ${reviewer}: score ${score}`);
      return true;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`ReputationResolver.submitFeedback failed for agent ${agentId}:`, error);
      throw new GraphQLError('Failed to submit feedback', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => [Feedback])
  async getAgentReviews(@Arg("agentId", () => String) agentId: string): Promise<Feedback[]> {
    try {
      const reputations = await reputationService.getAgentReputations(agentId);
      
      return reputations.map(r => ({
        id: r.id,
        reviewer: r.reviewer,
        score: r.score,
        comment: r.comment || "",
        paymentProof: r.paymentProof,
        timestamp: r.timestamp.toISOString()
      }));
    } catch (error) {
      logger.error(`ReputationResolver.getAgentReviews failed for agent ${agentId}:`, error);
      throw new GraphQLError('Failed to fetch agent reviews', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }
}
