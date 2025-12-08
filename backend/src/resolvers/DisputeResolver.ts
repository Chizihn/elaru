import { Resolver, Query, Mutation, Arg, FieldResolver, Root } from "type-graphql";
import { GraphQLError } from "graphql";
import { Dispute, DisputeVote } from "../entities/Dispute";
import { disputeService } from "../services/DisputeService";
import { taskService } from "../services/TaskService";
import { Task } from "../entities/Task";
import { DisputeState } from "@prisma/client";
import logger from "../utils/logger";

@Resolver(Dispute)
export class DisputeResolver {
  @Query(() => [Dispute])
  async getAllDisputes(): Promise<any[]> {
    try {
      return await disputeService.getAllDisputes();
    } catch (error) {
      logger.error('DisputeResolver.getAllDisputes failed:', error);
      throw new GraphQLError('Failed to fetch disputes', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => Dispute, { nullable: true })
  async getDispute(@Arg("id", () => String) id: string): Promise<any | null> {
    try {
      return await disputeService.getDisputeById(id);
    } catch (error) {
      logger.error(`DisputeResolver.getDispute failed for id ${id}:`, error);
      throw new GraphQLError('Failed to fetch dispute', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => [Dispute])
  async getDisputesByStatus(@Arg("status", () => DisputeState) status: DisputeState): Promise<any[]> {
    try {
      return await disputeService.getDisputesByStatus(status);
    } catch (error) {
      logger.error(`DisputeResolver.getDisputesByStatus failed for status ${status}:`, error);
      throw new GraphQLError('Failed to fetch disputes by status', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => Dispute)
  async raiseDispute(
    @Arg("taskId", () => String) taskId: string,
    @Arg("raisedBy", () => String) raisedBy: string,
    @Arg("reason", () => String) reason: string
  ): Promise<Dispute> {
    try {
      return await disputeService.createDispute(taskId, raisedBy, reason);
    } catch (error) {
      logger.error(`DisputeResolver.raiseDispute failed for task ${taskId}:`, error);
      throw new GraphQLError('Failed to raise dispute', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => DisputeVote)
  async voteOnDispute(
    @Arg("disputeId", () => String) disputeId: string,
    @Arg("validator", () => String) validator: string,
    @Arg("approveRefund", () => Boolean) approveRefund: boolean,
    @Arg("comment", () => String, { nullable: true }) comment: string | null
  ): Promise<DisputeVote> {
    try {
      return await disputeService.submitVote(disputeId, validator, approveRefund, comment);
    } catch (error) {
      logger.error(`DisputeResolver.voteOnDispute failed for dispute ${disputeId}:`, error);
      throw new GraphQLError('Failed to submit vote', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => [DisputeVote])
  async getDisputeVotes(@Arg("disputeId", () => String) disputeId: string): Promise<DisputeVote[]> {
    try {
      return await disputeService.getDisputeVotes(disputeId);
    } catch (error) {
      logger.error(`DisputeResolver.getDisputeVotes failed for dispute ${disputeId}:`, error);
      throw new GraphQLError('Failed to fetch dispute votes', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @FieldResolver(() => Task)
  async task(@Root() dispute: Dispute): Promise<Task | null> {
    try {
      return await taskService.getTaskById(dispute.taskId);
    } catch (error) {
      logger.error(`DisputeResolver.task failed for dispute ${dispute.id}:`, error);
      throw new GraphQLError('Failed to fetch task for dispute', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }
}
