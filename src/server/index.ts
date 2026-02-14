import { Elysia } from "elysia";
import { errorHandler } from "@/server/errors";
import { logger } from "@/server/logger";
import { todoController } from "@/server/modules/todo";
import { betterAuthPlugin } from "@/server/plugins/auth";

export const app = new Elysia({ prefix: "/api" })
  .use(logger.into({ autoLogging: true }))
  .use(errorHandler)
  .use(betterAuthPlugin)
  .use(todoController);

export type App = typeof app;
