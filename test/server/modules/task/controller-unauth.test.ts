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
  // All task endpoints require authentication; unauthenticated requests must be rejected before reaching the service
  it("should return 401 when GET /api/tasks without auth", async () => {
    // When an unauthenticated user tries to list tasks
    const res = await client.request("/api/tasks");

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });

  it("should return 401 when POST /api/tasks without auth", async () => {
    // When an unauthenticated user tries to create a task
    const res = await client.json("/api/tasks", {
      title: "Test",
      columnId: 1,
    });

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });

  it("should return 401 when PUT /api/tasks/:id without auth", async () => {
    // When an unauthenticated user tries to update a task
    const res = await client.json("/api/tasks/1", { title: "Test" }, "PUT");

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });

  it("should return 401 when DELETE /api/tasks/:id without auth", async () => {
    // When an unauthenticated user tries to delete a task
    const res = await client.request("/api/tasks/1", { method: "DELETE" });

    // Then it should reject with 401
    expect(res.status).toBe(401);
  });
});
