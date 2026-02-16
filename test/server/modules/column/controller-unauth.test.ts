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
  it("GET /api/columns — returns 401", async () => {
    const res = await client.request("/api/columns");
    expect(res.status).toBe(401);
  });

  it("POST /api/columns — returns 401", async () => {
    const res = await client.json("/api/columns", { title: "Test" });
    expect(res.status).toBe(401);
  });

  it("PUT /api/columns/:id — returns 401", async () => {
    const res = await client.json("/api/columns/1", { title: "Test" }, "PUT");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/columns/:id — returns 401", async () => {
    const res = await client.request("/api/columns/1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});
