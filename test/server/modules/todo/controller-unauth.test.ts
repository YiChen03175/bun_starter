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

mock.module("@/server/modules/todo/service", () => ({
  TodoService: serviceMock,
}));

const { app } = await import("@/server");
const client = createTestClient(app);

describe("Todo Controller — unauthenticated", () => {
  it("GET /api/todos — returns 401", async () => {
    const res = await client.request("/api/todos");
    expect(res.status).toBe(401);
  });

  it("POST /api/todos — returns 401", async () => {
    const res = await client.json("/api/todos", { title: "Test" });
    expect(res.status).toBe(401);
  });

  it("PUT /api/todos/:id — returns 401", async () => {
    const res = await client.json("/api/todos/1", { completed: true }, "PUT");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/todos/:id — returns 401", async () => {
    const res = await client.request("/api/todos/1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});
