import { Elysia } from "elysia";
import { logger } from "./logger";
import { todoController } from "./modules/todo";

export const app = new Elysia({ prefix: "/api" })
  .use(logger.into({ autoLogging: true }))
  .use(todoController);

export type App = typeof app;
