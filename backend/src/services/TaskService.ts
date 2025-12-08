import prisma from "../configs/database";
import { Task, TaskStatus, PaymentStatus, DisputeStatus } from "@prisma/client";
import logger from "../utils/logger";
import {ethers} from "ethers";

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(userId: string, description: string): Promise<Task> {
    try {
      const task = await prisma.task.create({
        data: {
          userId,
          description,
          status: TaskStatus.PENDING
        }
      });
      logger.info(`Task created: ${task.id} for user: ${userId}`);
      return task;
    } catch (error) {
      logger.error(`Failed to create task for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { agent: true }
      });
      if (!task) {
        logger.warn(`Task not found: ${id}`);
      }
      return task;
    } catch (error) {
      logger.error(`Failed to get task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all tasks for a user
   */
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const tasks = await prisma.task.findMany({
        where: { userId },
        include: { agent: true },
        orderBy: { createdAt: 'desc' }
      });
      logger.debug(`Retrieved ${tasks.length} tasks for user: ${userId}`);
      return tasks;
    } catch (error) {
      logger.error(`Failed to get tasks for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all tasks for a user by wallet address
   * This is more reliable as it matches how recordInteraction works
   */
  async getUserTasksByWallet(walletAddress: string): Promise<Task[]> {
    try {
      // First find user by wallet
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        logger.debug(`No user found for wallet: ${walletAddress}`);
        return [];
      }

      const tasks = await prisma.task.findMany({
        where: { userId: user.id },
        include: { agent: true },
        orderBy: { createdAt: 'desc' }
      });
      logger.debug(`Retrieved ${tasks.length} tasks for wallet: ${walletAddress}`);
      return tasks;
    } catch (error) {
      logger.error(`Failed to get tasks for wallet ${walletAddress}:`, error);
      throw error;
    }
  }

  /**
   * Assign agent to task
   */
  async assignAgent(taskId: string, agentId: string): Promise<Task> {
    try {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          selectedAgentId: agentId,
          status: TaskStatus.ASSIGNED
        }
      });
      logger.info(`Agent ${agentId} assigned to task ${taskId}`);
      return task;
    } catch (error) {
      logger.error(`Failed to assign agent ${agentId} to task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Update task payment info
   */


  /**
   * Update task payment info with on-chain verification
   */
  async updatePayment(
    taskId: string,
    paymentTxHash: string,
    paymentStatus: PaymentStatus
  ): Promise<Task> {
    try {
      // Verify transaction on-chain
      if (process.env.NODE_ENV === 'production' || process.env.VERIFY_ON_CHAIN === 'true') {
        const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
        const tx = await provider.getTransaction(paymentTxHash);
        const receipt = await provider.getTransactionReceipt(paymentTxHash);

        if (!tx || !receipt) {
          throw new Error("Transaction not found");
        }

        if (receipt.status !== 1) {
          throw new Error("Transaction failed on-chain");
        }

        // Additional checks (recipient, amount) could be added here
        logger.info(`On-chain verification successful for ${paymentTxHash}`);
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          paymentTxHash,
          paymentStatus,
          status: TaskStatus.PAID
        }
      });
      logger.info(`Payment updated for task ${taskId}: ${paymentTxHash} - ${paymentStatus}`);
      return task;
    } catch (error) {
      logger.error(`Failed to update payment for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string, result: string): Promise<Task> {
    try {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.COMPLETED,
          result,
          completedAt: new Date()
        }
      });
      logger.info(`Task completed: ${taskId}`);
      return task;
    } catch (error) {
      logger.error(`Failed to complete task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Submit review for task
   */
  async submitReview(
    taskId: string,
    reviewScore: number,
    reviewComment: string | null
  ): Promise<Task> {
    try {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          reviewScore,
          reviewComment,
          status: TaskStatus.REVIEWED
        }
      });
      logger.info(`Review submitted for task ${taskId}: score ${reviewScore}`);
      return task;
    } catch (error) {
      logger.error(`Failed to submit review for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Raise dispute for task
   */
  async raiseDispute(taskId: string, reason: string): Promise<Task> {
    try {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          disputeStatus: DisputeStatus.RAISED,
          disputeReason: reason,
          disputeRaisedAt: new Date()
        }
      });
      logger.warn(`Dispute raised for task ${taskId}: ${reason}`);
      return task;
    } catch (error) {
      logger.error(`Failed to raise dispute for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const tasks = await prisma.task.findMany({
        where: { status },
        include: { agent: true },
        orderBy: { createdAt: 'desc' }
      });
      logger.debug(`Retrieved ${tasks.length} tasks with status: ${status}`);
      return tasks;
    } catch (error) {
      logger.error(`Failed to get tasks by status ${status}:`, error);
      throw error;
    }
  }
  /**
   * Get tasks for an agent
   */
  async getAgentTasks(agentId: string, status?: TaskStatus): Promise<Task[]> {
    try {
      const where: any = { selectedAgentId: agentId };
      if (status) {
        where.status = status;
      }

      const tasks = await prisma.task.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
      logger.debug(`Retrieved ${tasks.length} tasks for agent: ${agentId}`);
      return tasks;
    } catch (error) {
      logger.error(`Failed to get tasks for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's chat history with a specific agent
   */
  async getUserAgentHistory(walletAddress: string, agentId: string): Promise<Task[]> {
    try {
      // First find user by wallet
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        logger.debug(`No user found for wallet: ${walletAddress}`);
        return [];
      }

      const tasks = await prisma.task.findMany({
        where: { 
          userId: user.id,
          selectedAgentId: agentId
        },
        include: { agent: true },
        orderBy: { createdAt: 'desc' }
      });
      logger.debug(`Retrieved ${tasks.length} history items for wallet ${walletAddress} with agent ${agentId}`);
      return tasks;
    } catch (error) {
      logger.error(`Failed to get agent history for wallet ${walletAddress}:`, error);
      throw error;
    }
  }

  /**
   * Record a completed interaction (for history/dashboard)
   * Accepts wallet address and auto-creates user if needed
   */
  async recordInteraction(
    walletAddress: string, 
    agentId: string, 
    description: string, 
    txHash: string, 
    result: string
  ): Promise<Task> {
    try {
      // First, ensure user exists (upsert)
      const user = await prisma.user.upsert({
        where: { walletAddress },
        update: {}, // No update needed
        create: {
          walletAddress,
          nonce: Math.random().toString(36).substring(7), // Generate random nonce
        }
      });

      const task = await prisma.task.create({
        data: {
          userId: user.id,
          description,
          status: TaskStatus.COMPLETED,
          selectedAgentId: agentId,
          paymentTxHash: txHash,
          paymentStatus: PaymentStatus.COMPLETED,
          result,
          completedAt: new Date()
        }
      });
      logger.info(`Recorded interaction task: ${task.id} for wallet: ${walletAddress}`);
      return task;
    } catch (error) {
      logger.error(`Failed to record interaction:`, error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
