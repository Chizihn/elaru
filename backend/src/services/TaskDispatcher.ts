import { PrismaClient, TaskStatus, PaymentStatus } from "@prisma/client";
import { agentService } from "./AgentService";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export class TaskDispatcher {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  startDispatcher() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info("🚀 Task Dispatcher started");

    // Poll every 5 seconds
    this.intervalId = setInterval(() => this.dispatchLoop(), 5000);
  }

  stopDispatcher() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info("🛑 Task Dispatcher stopped");
  }

  private async dispatchLoop() {
    try {
      // Find tasks that are PAID but still PENDING (not yet dispatched/processing)
      // Or tasks that are PAID and ASSIGNED but not yet processed
      const tasksToDispatch = await prisma.task.findMany({
        where: {
          status: { in: [TaskStatus.PENDING, TaskStatus.ASSIGNED] },
          paymentStatus: PaymentStatus.VERIFIED,
          selectedAgentId: { not: null }
        },
        include: {
          agent: true
        },
        take: 10 // Process in batches
      });

      if (tasksToDispatch.length > 0) {
        logger.info(`📦 Dispatcher found ${tasksToDispatch.length} paid tasks`);
      }

      for (const task of tasksToDispatch) {
        if (!task.agent || !task.agent.endpoint) {
          logger.warn(`Task ${task.id} has no agent or endpoint. Skipping.`);
          continue;
        }

        // Dispatch to Agent
        await agentService.dispatchTask(task, task.agent);
      }
    } catch (error) {
      logger.error("Dispatcher loop error:", error);
    }
  }
}

export const taskDispatcher = new TaskDispatcher();
