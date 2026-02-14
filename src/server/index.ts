import { Elysia } from "elysia";
import { errorHandler } from "./errors";
import { logger } from "./logger";
import { todoController } from "./modules/todo";

// For cross-origin API access, install @elysiajs/cors:
//   import { cors } from "@elysiajs/cors";
//   .use(cors())

export const app = new Elysia({ prefix: "/api" })
  .use(logger.into({ autoLogging: true }))
  .use(errorHandler)
  .use(todoController);

export type App = typeof app;
