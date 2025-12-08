import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Int,
  ObjectType,
  Field,
  UseMiddleware,
  FieldResolver,
  Root,
  Float,
} from "type-graphql";
import { GraphQLError } from "graphql";
import { Agent } from "../entities/Agent";
import { agentService } from "../services/AgentService";
import logger from "../utils/logger";
import { isAuth } from "../middleware/isAuth";

@ObjectType()
class ReputationHistoryPoint {
  @Field()
  date!: string;

  @Field()
  score!: number;
}

@Resolver(() => Agent)
export class AgentResolver {
  @Query(() => [Agent])
  async getAgents(
    @Arg("skip", () => Int, { defaultValue: 0 }) skip: number,
    @Arg("take", () => Int, { defaultValue: 10 }) take: number
  ): Promise<Agent[]> {
    try {
      // We need to update AgentService to support pagination, or slice here for now if service doesn't support it
      const allAgents = await agentService.getAllAgents();
      logger.info(
        `AgentResolver.getAgents: Found ${
          allAgents.length
        } agents. Returning slice ${skip}-${skip + take}`
      );
      return allAgents.slice(skip, skip + take);
    } catch (error) {
      logger.error("AgentResolver.getAgents failed:", error);
      throw new GraphQLError("Failed to fetch agents", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @Query(() => [ReputationHistoryPoint])
  async getReputationHistory(): Promise<ReputationHistoryPoint[]> {
    // Mock data for the chart until we have a real history table
    // This allows the frontend to be built with the correct structure
    const now = new Date();
    const history: ReputationHistoryPoint[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString(),
        score: 70 + Math.random() * 30, // Random score between 70 and 100
      });
    }
    return history;
  }

  @Query(() => Agent, { nullable: true })
  async getAgent(@Arg("id", () => String) id: string): Promise<Agent | null> {
    try {
      return await agentService.getAgentById(id);
    } catch (error) {
      logger.error(`AgentResolver.getAgent failed for id ${id}:`, error);
      throw new GraphQLError("Failed to fetch agent", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @Query(() => Agent, { nullable: true })
  async getAgentByWallet(
    @Arg("walletAddress", () => String) walletAddress: string
  ): Promise<Agent | null> {
    try {
      return await agentService.getAgentByWallet(walletAddress);
    } catch (error) {
      logger.error(
        `AgentResolver.getAgentByWallet failed for ${walletAddress}:`,
        error
      );
      throw new GraphQLError("Failed to fetch agent by wallet", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @Query(() => [Agent])
  @UseMiddleware(isAuth)
  async getUserAgents(
    @Arg("walletAddress", () => String) walletAddress: string
  ): Promise<Agent[]> {
    try {
      const agent = await agentService.getAgentByWallet(walletAddress);
      return agent ? [agent] : [];
    } catch (error) {
      logger.error(
        `AgentResolver.getUserAgents failed for ${walletAddress}:`,
        error
      );
      throw new GraphQLError("Failed to fetch user agents", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @Query(() => [Agent])
  async getTopAgents(
    @Arg("limit", () => Int, { defaultValue: 10 }) limit: number
  ): Promise<Agent[]> {
    try {
      const agents = await agentService.getTopAgents(limit);
      logger.info(
        `AgentResolver.getTopAgents: Returning ${agents.length} agents`
      );
      return agents;
    } catch (error) {
      logger.error(
        `AgentResolver.getTopAgents failed with limit ${limit}:`,
        error
      );
      throw new GraphQLError("Failed to fetch top agents", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @Query(() => [Agent])
  async findAgentsForTask(
    @Arg("taskDescription", () => String) taskDescription: string,
    @Arg("minTrustScore", () => Int) minTrustScore: number
  ): Promise<Agent[]> {
    try {
      // For now, we just filter by reputation score.
      // In a real implementation, we might use embeddings to match description to agent capabilities.
      const agents = await agentService.getAllAgents();
      const searchLower = taskDescription.toLowerCase();

      return agents.filter((agent) => {
        if (agent.reputationScore < minTrustScore) return false;

        if (!searchLower) return true;

        // 1. Tokenize and filter stop words
        const stopWords = [
          "i",
          "need",
          "a",
          "an",
          "the",
          "for",
          "to",
          "of",
          "in",
          "with",
          "on",
          "at",
          "by",
          "from",
          "about",
          "is",
          "are",
          "was",
          "were",
          "be",
          "been",
          "being",
          "have",
          "has",
          "had",
          "do",
          "does",
          "did",
          "can",
          "could",
          "should",
          "would",
          "will",
          "shall",
          "may",
          "might",
          "must",
        ];
        const keywords = searchLower
          .split(/[\s,.-]+/) // Split by whitespace and punctuation
          .filter((w) => w.length > 2 && !stopWords.includes(w)); // Filter short words and stop words

        if (keywords.length === 0) return true; // If no keywords left, return all (or maybe none? let's return all for now to be safe)

        const serviceType = agent.serviceType
          ? agent.serviceType.toLowerCase()
          : "";
        const description = agent.description
          ? agent.description.toLowerCase()
          : "";
        const name = agent.name ? agent.name.toLowerCase() : "";

        // 2. Check for matches (OR logic - if any keyword matches any field)
        return keywords.some(
          (keyword) =>
            serviceType.includes(keyword) ||
            description.includes(keyword) ||
            name.includes(keyword)
        );
      });
    } catch (error) {
      logger.error(`AgentResolver.findAgentsForTask failed:`, error);
      throw new GraphQLError("Failed to find agents for task", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @Mutation(() => Agent)
  @UseMiddleware(isAuth)
  async registerAgent(
    @Arg("walletAddress", () => String) walletAddress: string,
    @Arg("name", () => String) name: string,
    @Arg("serviceType", () => String) serviceType: string,
    @Arg("endpoint", () => String) endpoint: string,
    @Arg("description", () => String) description: string,
    @Arg("pricePerRequest", () => String) pricePerRequest: string,
    @Arg("responseType", () => String, { nullable: true }) responseType?: string
  ): Promise<Agent> {
    try {
      return await agentService.registerAgent(
        walletAddress,
        name,
        serviceType,
        endpoint,
        description,
        pricePerRequest,
        responseType || "MARKDOWN"
      );
    } catch (error) {
      logger.error(
        `AgentResolver.registerAgent failed for ${walletAddress}:`,
        error
      );
      throw new GraphQLError("Failed to register agent", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @Mutation(() => Agent)
  @UseMiddleware(isAuth)
  async stakeAgent(
    @Arg("walletAddress", () => String) walletAddress: string,
    @Arg("stakedAmount", () => String) stakedAmount: string,
    @Arg("stakingTxHash", () => String) stakingTxHash: string
  ): Promise<Agent> {
    try {
      return await agentService.stakeAgent(
        walletAddress,
        stakedAmount,
        stakingTxHash
      );
    } catch (error) {
      logger.error(
        `AgentResolver.stakeAgent failed for ${walletAddress}:`,
        error
      );
      throw new GraphQLError("Failed to stake agent", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }

  @FieldResolver(() => Int)
  async completedTasksCount(@Root() agent: Agent): Promise<number> {
    const stats = await agentService.getAgentStats(agent.id);
    return stats.completedTasks;
  }

  @FieldResolver(() => Int)
  async validationCount(@Root() agent: Agent): Promise<number> {
    const stats = await agentService.getAgentStats(agent.id);
    return stats.validations;
  }

  @FieldResolver(() => Float)
  async successRate(@Root() agent: Agent): Promise<number> {
    const stats = await agentService.getAgentStats(agent.id);
    return stats.successRate;
  }

  @Mutation(() => Agent)
  @UseMiddleware(isAuth)
  async updateAgent(
    @Arg("walletAddress", () => String) walletAddress: string,
    @Arg("name", () => String, { nullable: true }) name?: string,
    @Arg("description", () => String, { nullable: true }) description?: string,
    @Arg("endpoint", () => String, { nullable: true }) endpoint?: string,
    @Arg("pricePerRequest", () => String, { nullable: true }) pricePerRequest?: string
  ): Promise<Agent> {
    try {
      const agent = await agentService.getAgentByWallet(walletAddress);
      if (!agent) {
        throw new GraphQLError("Agent not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Update only provided fields
      const updateData: Partial<Agent> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (endpoint !== undefined) updateData.endpoint = endpoint;
      if (pricePerRequest !== undefined) updateData.pricePerRequest = pricePerRequest;

      const updatedAgent = await agentService.updateAgent(agent.id, updateData);
      logger.info(`Agent ${agent.id} updated by ${walletAddress}`);
      return updatedAgent;
    } catch (error) {
      logger.error(`AgentResolver.updateAgent failed for ${walletAddress}:`, error);
      throw new GraphQLError("Failed to update agent", {
        extensions: { code: "INTERNAL_SERVER_ERROR", originalError: error },
      });
    }
  }
}
