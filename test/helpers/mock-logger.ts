import { mock } from "bun:test";
import { Elysia } from "elysia";

/** Complete logger mock that satisfies both pino (.info, .error, …) and elysia-logger (.into) APIs */
export const mockLogger = {
  trace: mock(),
  debug: mock(),
  info: mock(),
  warn: mock(),
  error: mock(),
  fatal: mock(),
  silent: mock(),
  into: mock(() => new Elysia()),
};

mock.module("@/server/logger", () => ({ logger: mockLogger }));
