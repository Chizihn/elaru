import { Router, Request, Response } from "express";
import { taskService } from "../services/TaskService";
import logger from "../utils/logger";

export const tasksRouter = Router();

/**
 * POST /interaction
 * Records a completed task interaction from the client side.
 * This allows external agents (who cannot access DB) to have their
 * successful tasks recorded by the client wallet.
 */
tasksRouter.post("/interaction", async (req: Request, res: Response) => {
  try {
    const { walletAddress, agentId, description, txHash, result } = req.body;

    if (!walletAddress || !agentId || !description || !txHash) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Record the interaction in the database
    const task = await taskService.recordInteraction(
      walletAddress,
      agentId,
      description,
      txHash,
      result || "No result provided"
    );

    logger.info(`Recorded interaction via API: ${task.id}`);
    res.json({ success: true, taskId: task.id });
  } catch (error: any) {
    logger.error("Failed to record api interaction:", error);
    res.status(500).json({ error: "Failed to record interaction", details: error.message });
  }
});
