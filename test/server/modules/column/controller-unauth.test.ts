import { describe, expect, it, mock } from "bun:test";
import { createTestClient } from "test/helpers/elysia";
import "test/helpers/mock-logger";

mock.module("@/server/auth", () => ({
  auth: {
    handler: () => new Response(null, { status: 404 }),
    api: {
      getSession: mock(() => Promise.resolve(null)),
    },
  },
}));

const serviceMock = {
  list: mock(() => {
    throw new Error("Service should not be called");
  }),
  create: mock(() => {
    throw new Error("Service should not be called");
  }),
  update: mock(() => {
    throw new Error("Service should not be called");
  }),
  remove: mock(() => {
    throw new Error("Service should not be called");
  }),
};

mock.module("@/server/modules/column/service", () => ({
  ColumnService: serviceMock,
}));

const { app } = await import("@/server");
const client = createTestClient(app);

describe("Column Controller — unauthenticated", () => {
  // All column endpoints require authentication; unauthenticated requests must be rejected before reaching the service
  it("should return 401 when GET /api/columns without auth", async () => {
    // When an unauthenticated user tries to list columns
    const res = await client.request("/api/columns");

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });

  it("should return 401 when POST /api/columns without auth", async () => {
    // When an unauthenticated user tries to create a column
    const res = await client.json("/api/columns", { title: "Test" });

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });

  it("should return 401 when PUT /api/columns/:id without auth", async () => {
    // When an unauthenticated user tries to update a column
    const res = await client.json("/api/columns/1", { title: "Test" }, "PUT");

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });

  it("should return 401 when DELETE /api/columns/:id without auth", async () => {
    // When an unauthenticated user tries to delete a column
    const res = await client.request("/api/columns/1", { method: "DELETE" });

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });
});
