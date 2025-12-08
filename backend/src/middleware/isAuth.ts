import { MiddlewareInterface, NextFn, ResolverData } from "type-graphql";
import { GraphQLError } from "graphql";
import logger from "../utils/logger";

interface Context {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

export class isAuth implements MiddlewareInterface<Context> {
  async use({ context, info }: ResolverData<Context>, next: NextFn) {
    if (!context.user) {
      logger.warn(`${info.parentType.name}.${info.fieldName}: Unauthenticated request`);
      throw new GraphQLError("Authentication required", {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    }
    return next();
  }
}
