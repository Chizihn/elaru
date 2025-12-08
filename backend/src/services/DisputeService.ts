import prisma from "../configs/database";
import { Dispute, DisputeVote, DisputeState, DisputeStatus } from "@prisma/client";
import logger from "../utils/logger";

const VALIDATOR_THRESHOLD = 2; // Need 2 validator votes to resolve

export class DisputeService {
  /**
   * Create a new dispute
   */
  async createDispute(
    taskId: string,
    raisedBy: string,
    reason: string
  ): Promise<Dispute> {
    try {
      const dispute = await prisma.dispute.create({
        data: {
          taskId,
          raisedBy,
          reason,
          status: DisputeState.PENDING
        }
      });
      logger.warn(`Dispute created: ${dispute.id} for task ${taskId} by ${raisedBy}`);
      return dispute;
    } catch (error) {
      logger.error(`Failed to create dispute for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(id: string) {
    return await prisma.dispute.findUnique({
      where: { id },
      include: { votes: true }
    });
  }

  /**
   * Get all disputes
   */
  async getAllDisputes() {
    return await prisma.dispute.findMany({
      include: { votes: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get disputes by status
   */
  async getDisputesByStatus(status: DisputeState) {
    return await prisma.dispute.findMany({
      where: { status },
      include: { votes: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Submit validator vote
   */
  async submitVote(
    disputeId: string,
    validator: string,
    approveRefund: boolean,
    comment: string | null
  ): Promise<DisputeVote> {
    try {
      // Check if validator already voted
      const existingVote = await prisma.disputeVote.findFirst({
        where: { disputeId, validator }
      });

      if (existingVote) {
        logger.warn(`Validator ${validator} already voted on dispute ${disputeId}`);
        throw new Error("Validator has already voted on this dispute");
      }

      // Create vote
      const vote = await prisma.disputeVote.create({
        data: {
          disputeId,
          validator,
          approveRefund,
          comment
        }
      });

      logger.info(`Vote submitted for dispute ${disputeId} by ${validator}: ${approveRefund ? 'REFUND' : 'RELEASE'}`);

      // Check if we should resolve the dispute
      await this.checkAndResolveDispute(disputeId);

      return vote;
    } catch (error) {
      logger.error(`Failed to submit vote for dispute ${disputeId}:`, error);
      throw error;
    }
  }

  /**
   * Check if dispute has enough votes and resolve
   */
  private async checkAndResolveDispute(disputeId: string): Promise<void> {
    const dispute = await this.getDisputeById(disputeId);
    if (!dispute) return;

    const votes = dispute.votes;
    if (votes.length < VALIDATOR_THRESHOLD) return;

    // Count votes
    const refundVotes = votes.filter(v => v.approveRefund).length;
    const releaseVotes = votes.filter(v => !v.approveRefund).length;

    let newStatus: DisputeState;
    let taskDisputeStatus: DisputeStatus;

    if (refundVotes >= VALIDATOR_THRESHOLD) {
      newStatus = DisputeState.RESOLVED_REFUND;
      taskDisputeStatus = DisputeStatus.RESOLVED_REFUND;
      logger.info(`💰 Dispute ${disputeId} resolved: REFUND approved`);
    } else if (releaseVotes >= VALIDATOR_THRESHOLD) {
      newStatus = DisputeState.RESOLVED_RELEASE;
      taskDisputeStatus = DisputeStatus.RESOLVED_RELEASE;
      logger.info(`✅ Dispute ${disputeId} resolved: RELEASE approved`);
    } else {
      return; // Not enough votes yet
    }

    // Update dispute status
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: newStatus,
        resolvedAt: new Date()
      }
    });

    // Update task dispute status
    await prisma.task.update({
      where: { id: dispute.taskId },
      data: {
        disputeStatus: taskDisputeStatus
      }
    });
  }

  /**
   * Get votes for a dispute
   */
  async getDisputeVotes(disputeId: string): Promise<DisputeVote[]> {
    return await prisma.disputeVote.findMany({
      where: { disputeId },
      orderBy: { votedAt: 'desc' }
    });
  }

  /**
   * Check if validator has voted
   */
  async hasValidatorVoted(disputeId: string, validator: string): Promise<boolean> {
    const vote = await prisma.disputeVote.findFirst({
      where: { disputeId, validator }
    });
    return vote !== null;
  }
}

export const disputeService = new DisputeService();
