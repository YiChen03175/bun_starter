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

const columnServiceMock = {
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
  ColumnService: columnServiceMock,
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

mock.module("@/server/modules/task/service", () => ({
  TaskService: serviceMock,
}));

const { app } = await import("@/server");
const client = createTestClient(app);

describe("Task Controller — unauthenticated", () => {
  it("GET /api/tasks — returns 401", async () => {
    const res = await client.request("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("POST /api/tasks — returns 401", async () => {
    const res = await client.json("/api/tasks", {
      title: "Test",
      columnId: 1,
    });
    expect(res.status).toBe(401);
  });

  it("PUT /api/tasks/:id — returns 401", async () => {
    const res = await client.json("/api/tasks/1", { title: "Test" }, "PUT");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/tasks/:id — returns 401", async () => {
    const res = await client.request("/api/tasks/1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});
