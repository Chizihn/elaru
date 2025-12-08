import { Resolver, Query, Arg, Float, Int, ObjectType, Field } from "type-graphql";
import { GraphQLError } from "graphql";
import { Agent } from "../entities/Agent";
import prisma from "../configs/database";
import logger from "../utils/logger";

const USDC_DECIMALS = 1000000; // 6 decimals
const SLASH_AMOUNT_AVAX = 0.1; // 0.1 AVAX per slash (reduced for fairness)

@ObjectType()
class SlashingEvent {
  @Field()
  id!: string;

  @Field()
  agentId!: string;

  @Field()
  agentName!: string;

  @Field()
  reason!: string;

  @Field()
  slashedAmount!: string;

  @Field()
  timestamp!: Date;

  @Field()
  reviewScore!: number;

  @Field()
  reviewer!: string;
}

@ObjectType()
class SlashingStats {
  @Field()
  totalSlashed24h!: number;

  @Field()
  slashingEvents24h!: number;

  @Field()
  deactivatedAgents!: number;

  @Field()
  totalSlashedAllTime!: number;
}

@Resolver()
export class AnalyticsResolver {
  @Query(() => Float)
  async getAgentEarnings(@Arg("walletAddress", () => String) walletAddress: string): Promise<number> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { walletAddress }
      });

      if (!agent) return 0;

      const tasks = await prisma.task.findMany({
        where: {
          selectedAgentId: agent.id,
          paymentStatus: "COMPLETED"
        },
        include: {
          agent: true
        }
      });

      // Sum up the amounts - pricePerRequest is in atomic units (6 decimals)
      const total = tasks.reduce((acc: number, curr: any) => {
        const priceAtomic = parseFloat(curr.agent?.pricePerRequest || "0");
        return acc + (priceAtomic / USDC_DECIMALS);
      }, 0);

      return total;
    } catch (error) {
      logger.error(`AnalyticsResolver.getAgentEarnings failed for ${walletAddress}:`, error);
      throw new GraphQLError('Failed to fetch agent earnings', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }
  
  @Query(() => Float)
  async getTotalNetworkVolume(): Promise<number> {
    try {
      const tasks = await prisma.task.findMany({
        where: { paymentStatus: "COMPLETED" },
        include: { agent: true }
      });

      // Sum all completed task payments - convert from atomic units
      const total = tasks.reduce((acc: number, curr: any) => {
        const priceAtomic = parseFloat(curr.agent?.pricePerRequest || "0");
        return acc + (priceAtomic / USDC_DECIMALS);
      }, 0);

      return total;
    } catch (error) {
      logger.error('AnalyticsResolver.getTotalNetworkVolume failed:', error);
      throw new GraphQLError('Failed to fetch network volume', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => [SlashingEvent])
  async getSlashingEvents(@Arg("limit", () => Int, { nullable: true }) limit?: number): Promise<SlashingEvent[]> {
    try {
      // Get reviews with score < 4 (these trigger slashing: 1, 2, 3 stars)
      const badReviews = await prisma.reputation.findMany({
        where: {
          score: { lt: 4 }
        },
        include: {
          agent: true
        },
        orderBy: { timestamp: 'desc' },
        take: limit || 20
      });

      return badReviews.map(review => ({
        id: review.id,
        agentId: review.agentId,
        agentName: review.agent.name || review.agent.serviceType,
        reason: review.comment || `Low review score: ${review.score}/5`,
        slashedAmount: SLASH_AMOUNT_AVAX.toString(),
        timestamp: review.timestamp,
        reviewScore: review.score,
        reviewer: review.reviewer
      }));
    } catch (error) {
      logger.error('AnalyticsResolver.getSlashingEvents failed:', error);
      throw new GraphQLError('Failed to fetch slashing events', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => SlashingStats)
  async getSlashingStats(): Promise<SlashingStats> {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Count bad reviews in last 24h
      const badReviews24h = await prisma.reputation.count({
        where: {
          score: { lt: 4 },
          timestamp: { gte: yesterday }
        }
      });

      // Count all bad reviews (for total)
      const allBadReviews = await prisma.reputation.count({
        where: {
          score: { lt: 4 }
        }
      });

      // Count deactivated agents (inactive)
      const deactivatedAgents = await prisma.agent.count({
        where: {
          active: false
        }
      });

      return {
        totalSlashed24h: badReviews24h * SLASH_AMOUNT_AVAX,
        slashingEvents24h: badReviews24h,
        deactivatedAgents,
        totalSlashedAllTime: allBadReviews * SLASH_AMOUNT_AVAX
      };
    } catch (error) {
      logger.error('AnalyticsResolver.getSlashingStats failed:', error);
      throw new GraphQLError('Failed to fetch slashing stats', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }
}
