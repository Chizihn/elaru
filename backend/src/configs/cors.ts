import { CorsOptions } from "cors";

export const corsConfig: CorsOptions = {
  origin:
    process.env.NODE_ENV === "development"
      ? "*"
      : [process.env.FRONTEND_URL || "localhost:3000", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "apollo-require-preflight",
    "x-agent-id"
  ],
};
