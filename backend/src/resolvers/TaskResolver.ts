import { Resolver, Query, Mutation, Arg, Ctx, Int, UseMiddleware } from "type-graphql";
import { GraphQLError } from "graphql";
import { Task } from "../entities/Task";
import { taskService } from "../services/TaskService";
import { TaskStatus, PaymentStatus } from "@prisma/client";
import logger from "../utils/logger";
import { isAuth } from "../middleware/isAuth";

interface Context {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

@Resolver(Task)
export class TaskResolver {
  @Mutation(() => Task)
  @UseMiddleware(isAuth)
  async submitTask(
    @Arg("description", () => String) description: string,
    @Arg("minTrustScore", () => Int) minTrustScore: number,
    @Ctx() context: Context
  ): Promise<Task> {
    try {
      return await taskService.createTask(context.user!.userId, description);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('TaskResolver.submitTask failed:', error);
      throw new GraphQLError('Failed to submit task', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => [Task])
  @UseMiddleware(isAuth)
  async getUserTasks(
    @Ctx() context: Context,
    @Arg("status", () => TaskStatus, { nullable: true }) status?: TaskStatus
  ): Promise<Task[]> {
    try {
      if (status) {
        return await taskService.getTasksByStatus(status);
      }
      // Use walletAddress for consistency with how interactions are recorded
      return await taskService.getUserTasksByWallet(context.user!.walletAddress);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('TaskResolver.getUserTasks failed:', error);
      throw new GraphQLError('Failed to fetch user tasks', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => Task, { nullable: true })
  @UseMiddleware(isAuth)
  async getTask(
    @Arg("id", () => String) id: string,
    @Ctx() context: Context
  ): Promise<Task | null> {
    try {
      return await taskService.getTaskById(id);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`TaskResolver.getTask failed for id ${id}:`, error);
      throw new GraphQLError('Failed to fetch task', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => Task)
  @UseMiddleware(isAuth)
  async assignAgentToTask(
    @Arg("taskId", () => String) taskId: string,
    @Arg("agentId", () => String) agentId: string,
    @Ctx() context: Context
  ): Promise<Task> {
    try {
      return await taskService.assignAgent(taskId, agentId);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`TaskResolver.assignAgentToTask failed for task ${taskId}:`, error);
      throw new GraphQLError('Failed to assign agent to task', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => Task)
  @UseMiddleware(isAuth)
  async updateTaskPayment(
    @Arg("taskId", () => String) taskId: string,
    @Arg("paymentTxHash", () => String) paymentTxHash: string,
    @Arg("paymentStatus", () => PaymentStatus) paymentStatus: PaymentStatus,
    @Ctx() context: Context
  ): Promise<Task> {
    try {
      return await taskService.updatePayment(taskId, paymentTxHash, paymentStatus);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`TaskResolver.updateTaskPayment failed for task ${taskId}:`, error);
      throw new GraphQLError('Failed to update task payment', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => Task)
  @UseMiddleware(isAuth)
  async completeTask(
    @Arg("taskId", () => String) taskId: string,
    @Arg("result", () => String) result: string,
    @Ctx() context: Context
  ): Promise<Task> {
    try {
      return await taskService.completeTask(taskId, result);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`TaskResolver.completeTask failed for task ${taskId}:`, error);
      throw new GraphQLError('Failed to complete task', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => Task)
  @UseMiddleware(isAuth)
  async submitTaskReview(
    @Arg("taskId", () => String) taskId: string,
    @Arg("reviewScore", () => Int) reviewScore: number,
    @Arg("reviewComment", () => String, { nullable: true }) reviewComment: string | undefined,
    @Ctx() context: Context
  ): Promise<Task> {
    try {
      return await taskService.submitReview(taskId, reviewScore, reviewComment || null);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`TaskResolver.submitTaskReview failed for task ${taskId}:`, error);
      throw new GraphQLError('Failed to submit task review', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => [Task])
  @UseMiddleware(isAuth)
  async getAgentTasks(
    @Ctx() context: Context,
    @Arg("agentId", () => String) agentId: string,
    @Arg("status", () => TaskStatus, { nullable: true }) status?: TaskStatus
  ): Promise<Task[]> {
    try {
      return await taskService.getAgentTasks(agentId, status);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`TaskResolver.getAgentTasks failed for agent ${agentId}:`, error);
      throw new GraphQLError('Failed to fetch agent tasks', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => [Task])
  @UseMiddleware(isAuth)
  async getAgentHistory(
    @Ctx() context: Context,
    @Arg("agentId", () => String) agentId: string
  ): Promise<Task[]> {
    try {
      // Get user's chat history with this specific agent
      return await taskService.getUserAgentHistory(context.user!.walletAddress, agentId);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`TaskResolver.getAgentHistory failed for agent ${agentId}:`, error);
      throw new GraphQLError('Failed to fetch agent history', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => Task)
  @UseMiddleware(isAuth)
  async recordAgentInteraction(
    @Arg("agentId", () => String) agentId: string,
    @Arg("description", () => String) description: string,
    @Arg("txHash", () => String) txHash: string,
    @Arg("result", () => String) result: string,
    @Ctx() context: Context
  ): Promise<Task> {
    try {
      return await taskService.recordInteraction(
        context.user!.walletAddress, // Use walletAddress - service will upsert user
        agentId,
        description,
        txHash,
        result
      );
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('TaskResolver.recordAgentInteraction failed:', error);
      throw new GraphQLError('Failed to record interaction', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }
}
