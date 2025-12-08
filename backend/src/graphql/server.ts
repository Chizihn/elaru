// src/graphql/server.ts
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { GraphQLError, GraphQLSchema } from "graphql";
import { Server } from "http";
import { Context } from "../types/Context";
import logger from "../utils/logger";


export async function createApolloServer(
  schema: GraphQLSchema,
  httpServer?: Server
) {
  const apolloServer = new ApolloServer<Context>({
    schema,
    plugins: [
      ...(httpServer ? [ApolloServerPluginDrainHttpServer({ httpServer })] : []),
      // Use local default for both dev and production - no auth needed!
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    introspection: true,
    includeStacktraceInErrorResponses: process.env.NODE_ENV === "development",
    csrfPrevention: true,
    cache: 'bounded',
    allowBatchedHttpRequests: true,
    formatError: (err) => {
      const originalError =
        (err instanceof GraphQLError && err.originalError) || undefined;

      logger.error("GraphQL Error:", {
        message: err.message,
        code: err.extensions?.code,
        stack: process.env.NODE_ENV === "development" ? originalError?.stack : undefined,
      });

      return {
        message: err.message,
        code: err.extensions?.code,
        ...(process.env.NODE_ENV === "development" && { stack: originalError?.stack }),
      };
    },
  });

  await apolloServer.start();
  return apolloServer;
}