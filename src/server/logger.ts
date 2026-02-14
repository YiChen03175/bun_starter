import { createPinoLogger } from "@bogeychan/elysia-logger";
import type { LoggerOptions } from "pino";

const isDev = process.env.NODE_ENV === "development";

function createLoggerConfig(): LoggerOptions {
  const level = process.env.LOG_LEVEL;

  if (isDev) {
    return {
      level: level ?? "debug",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    };
  }

  // Production: plain JSON to stdout — Vercel captures this natively
  return { level: level ?? "info" };
}

export const logger = createPinoLogger(createLoggerConfig());
