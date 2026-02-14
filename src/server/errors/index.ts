import { Elysia } from "elysia";
import { logger } from "@/server/logger";
import { ConflictError, ForbiddenError, UnauthorizedError } from "./http";

export const errorHandler = new Elysia({ name: "Error.Handler" })
  .error({ UnauthorizedError, ConflictError, ForbiddenError })
  .onError({ as: "scoped" }, ({ code, error, set }) => {
    switch (code) {
      case "NOT_FOUND":
        set.status = 404;
        return { error: error.message || "Not found" };
      case "VALIDATION":
        set.status = 422;
        return { error: "Validation failed" };
      case "UnauthorizedError":
        set.status = 401;
        return { error: error.message };
      case "ConflictError":
        set.status = 409;
        return { error: error.message };
      case "ForbiddenError":
        set.status = 403;
        return { error: error.message };
      default:
        logger.error(error, "unhandled error");
        set.status = 500;
        return { error: "Internal server error" };
    }
  });

export { ConflictError, ForbiddenError, UnauthorizedError } from "./http";
