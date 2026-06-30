import "dotenv/config"; 

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";

import { connectRedis } from "./services/redisService";
import chatRoutes from "./routes/chatRoutes";

const REQUIRED_ENV_VARS = ["DATABASE_URL", "GEMINI_API_KEY"] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(
      `[Server] Fatal: environment variable "${key}" is not set. ` +
        `Add it to your .env file and restart.`
    );
    process.exit(1);
  }
}

const PORT = Number(process.env.PORT ?? 3000);

function buildApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "*",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/chat", chatRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found.", code: "NOT_FOUND" });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Server] Unhandled error:", err.stack ?? err.message);
    res.status(500).json({
      error: "An unexpected server error occurred.",
      code: "INTERNAL_ERROR",
    });
  });

  return app;
}

async function bootstrap(): Promise<void> {
  await connectRedis();

  const app = buildApp();

  const server = app.listen(PORT, () => {
    console.log(`[Server] spur-nexus backend running on http://localhost:${PORT}`);
    console.log(`[Server] Environment : ${process.env.NODE_ENV ?? "development"}`);
    console.log(`[Server] CORS origin : ${process.env.CORS_ORIGIN ?? "*"}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully…`);

    server.close((err) => {
      if (err) {
        console.error("[Server] Error during shutdown:", err.message);
        process.exit(1);
      }
      console.log("[Server] All connections closed. Goodbye.");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("[Server] Graceful shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err: unknown) => {
  console.error("[Server] Fatal error during bootstrap:", err);
  process.exit(1);
});