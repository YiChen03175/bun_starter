import { describe, expect, test } from "bun:test";
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
  test("NOT_FOUND returns 404 with message", async () => {
    const res = await request("/not-found");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Resource not found");
  });

  test("NOT_FOUND with no message returns default", async () => {
    const res = await request("/not-found-empty");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("NOT_FOUND");
  });

  test("VALIDATION returns 422", async () => {
    const res = await json("/validation", { name: "" });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  test("UnauthorizedError returns 401", async () => {
    const res = await request("/unauthorized");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Token expired");
  });

  test("ConflictError returns 409", async () => {
    const res = await request("/conflict");
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Email already exists");
  });

  test("ForbiddenError returns 403", async () => {
    const res = await request("/forbidden");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Admin only");
  });

  test("unhandled error returns 500 and logs", async () => {
    mockLogger.error.mockClear();
    const res = await request("/internal");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
