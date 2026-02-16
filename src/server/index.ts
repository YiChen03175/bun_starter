import { Elysia } from "elysia";
import { errorHandler } from "@/server/errors";
import { logger } from "@/server/logger";
import { columnController } from "@/server/modules/column";
import { taskController } from "@/server/modules/task";
import { betterAuthPlugin } from "@/server/plugins/auth";

export const app = new Elysia({ prefix: "/api" })
  .use(logger.into({ autoLogging: true }))
  .use(errorHandler)
  .use(betterAuthPlugin)
  .use(columnController)
  .use(taskController);

export type App = typeof app;
