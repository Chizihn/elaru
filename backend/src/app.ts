import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet, { HelmetOptions } from "helmet";
import http, { Server as HttpServer } from "http";
import { expressMiddleware } from "@as-integrations/express5";
import { buildSchema } from "type-graphql";
import { ValidationResolver } from "./resolvers/ValidationResolver";
import { AnalyticsResolver } from "./resolvers/AnalyticsResolver";
import { AgentResolver } from "./resolvers/AgentResolver";
import { ReputationResolver } from "./resolvers/ReputationResolver";
import { AuthResolver } from "./resolvers/AuthResolver";
import { TaskResolver } from "./resolvers/TaskResolver";
import { DisputeResolver } from "./resolvers/DisputeResolver";
import { authMiddleware } from "./middleware/auth";
import logger from "./utils/logger";
import { corsConfig } from "./configs/cors";
import { createApolloServer } from "./graphql/server";
import prisma from "./configs/database";
import { agentsRouter } from "./agents";

export async function createApp() {
  const app = express();
  const httpServer: HttpServer = http.createServer(app);

  // Build GraphQL schema
  logger.info("Building GraphQL schema...");
  const schema = await buildSchema({
    resolvers: [
      AgentResolver,
      ReputationResolver,
      ValidationResolver,
      AnalyticsResolver,
      AuthResolver,
      TaskResolver,
      DisputeResolver,
    ],
    emitSchemaFile: true,
  });

  // Create Apollo Server
  const server = await createApolloServer(schema, httpServer);

  // Skip helmet for GraphQL to allow embedded Apollo landing page
  app.use((req, res, next) => {
    if (req.path === "/graphql") {
      return next();
    }

    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    } as HelmetOptions)(req, res, next);
  });

  // Middleware
  app.use(authMiddleware);
  app.use(cors(corsConfig));
  app.use(express.json());

  // Demo Agents Router
  app.use("/agents", agentsRouter);
  logger.info("Demo agents mounted at /agents/*");


  // GraphQL endpoint w
  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin:
        process.env.NODE_ENV === "production"
          ? [process.env.FRONTEND_URL || "localhost:3000"]
          : true, // mirrors origin in dev (safe + works with credentials)
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "apollo-require-preflight",
      ],
      preflightContinue: false,
      optionsSuccessStatus: 200,
    }),
    express.json({ limit: "10mb" }),
    expressMiddleware(server, {
      context: async ({ req }: any) => ({
        user: req.user,
      }),
    })
  );

  // await server.start();
  // server.applyMiddleware({ app: app as any });
  logger.info("Apollo Server started successfully");

  // Root endpoint
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Elaru API Server",
      version: "1.0.0",
      endpoints: {
        graphql: "/graphql",
        health: "/health",
      },
    });
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const gracefulShutdown = async (signal: string) => {
    // logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
      // Close HTTP server
      httpServer.close(() => {
        // logger.info("HTTP server closed");
      });

      // Close Apollo Server
      await server.stop();
      // logger.info("Apollo Server stopped");

      // Close database connections
      await prisma.$disconnect();
      // logger.info("Database disconnected");

      // Close Redis connection
      // logger.info("Redis disconnected");

      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  return { app, httpServer, apolloServer: server };
}
