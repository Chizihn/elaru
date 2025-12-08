import { Resolver, Query, Arg } from "type-graphql";
import { GraphQLError } from "graphql";
import { Validation } from "../entities/Validation";
import prisma from "../configs/database";
import logger from "../utils/logger";

@Resolver(Validation)
export class ValidationResolver {
  @Query(() => [Validation])
  async getValidations(@Arg("agentId", () => String) agentId: string): Promise<Validation[]> {
    try {
      // @ts-ignore
      const validations = await prisma.validation.findMany({
        where: { agentId },
        orderBy: { timestamp: 'desc' }
      });

      // @ts-ignore
      return validations.map(v => ({
        ...v,
        timestamp: v.timestamp.toISOString()
      }));
    } catch (error) {
      logger.error(`ValidationResolver.getValidations failed for agent ${agentId}:`, error);
      throw new GraphQLError('Failed to fetch validations', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }
}
