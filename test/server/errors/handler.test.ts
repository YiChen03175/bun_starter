import { describe, expect, it } from "bun:test";
import { createTestClient } from "test/helpers/elysia";
import { mockLogger } from "test/helpers/mock-logger";

const { Elysia, NotFoundError, t } = await import("elysia");
const { errorHandler } = await import("@/server/errors");
const { UnauthorizedError, ForbiddenError, ConflictError } = await import(
  "@/server/errors/http"
);

const app = new Elysia()
  .use(errorHandler)
  .get("/not-found", () => {
    throw new NotFoundError("Resource not found");
  })
  .get("/not-found-empty", () => {
    throw new NotFoundError();
  })
  .post("/validation", ({ body }) => body, {
    body: t.Object({ name: t.String({ minLength: 1 }) }),
  })
  .get("/unauthorized", () => {
    throw new UnauthorizedError("Token expired");
  })
  .get("/conflict", () => {
    throw new ConflictError("Email already exists");
  })
  .get("/forbidden", () => {
    throw new ForbiddenError("Admin only");
  })
  .get("/internal", () => {
    throw new Error("something broke");
  });

const { request, json } = createTestClient(app);

describe("errorHandler", () => {
  describe("known errors", () => {
    it("should return 404 with message when NotFoundError is thrown", async () => {
      // When a request hits a route that throws NotFoundError with a message
      const res = await request("/not-found");

      // Then it should respond with 404 and the custom error message
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Resource not found");
    });

    it("should return 404 with default message when NotFoundError has no message", async () => {
      // When a request hits a route that throws NotFoundError without a message
      const res = await request("/not-found-empty");

      // Then it should respond with 404 and the default "NOT_FOUND" message
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("NOT_FOUND");
    });

    it("should return 422 when validation fails", async () => {
      // When a request is sent with an invalid body (empty name)
      const res = await json("/validation", { name: "" });

      // Then it should respond with 422 and a validation error message
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("Validation failed");
    });

    it("should return 401 when UnauthorizedError is thrown", async () => {
      // When a request hits a route that throws UnauthorizedError
      const res = await request("/unauthorized");

      // Then it should respond with 401 and the error message
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Token expired");
    });

    it("should return 409 when ConflictError is thrown", async () => {
      // When a request hits a route that throws ConflictError
      const res = await request("/conflict");

      // Then it should respond with 409 and the conflict message
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Email already exists");
    });

    it("should return 403 when ForbiddenError is thrown", async () => {
      // When a request hits a route that throws ForbiddenError
      const res = await request("/forbidden");

      // Then it should respond with 403 and the forbidden message
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Admin only");
    });
  });

  describe("unhandled errors", () => {
    it("should return 500 and log when an unknown error is thrown", async () => {
      // Given the error logger is cleared
      mockLogger.error.mockClear();

      // When a request hits a route that throws an unhandled Error
      const res = await request("/internal");

      // Then it should respond with 500, a generic message, and log the error
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
