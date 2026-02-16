import { describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "elysia";
import { mockSession, mockUser } from "test/fixtures/auth";
import { mockTask } from "test/fixtures/board";
import { createTestClient } from "test/helpers/elysia";
import "test/helpers/mock-logger";

mock.module("@/server/auth", () => ({
  auth: {
    handler: () => new Response(null, { status: 404 }),
    api: {
      getSession: mock(() =>
        Promise.resolve({ user: mockUser, session: mockSession }),
      ),
    },
  },
}));

const columnServiceMock = {
  list: mock(() => []),
  create: mock(() => ({})),
  update: mock(() => ({})),
  remove: mock(() => ({})),
};

mock.module("@/server/modules/column/service", () => ({
  ColumnService: columnServiceMock,
}));

const serviceMock = {
  list: mock(
    (
      _userId: string,
      _opts: { columnId?: number; limit: number; offset: number },
    ) => ({
      tasks: [mockTask],
      total: 1,
    }),
  ),
  create: mock((data: Record<string, unknown>, _userId: string) => ({
    ...mockTask,
    ...data,
  })),
  update: mock((id: number, data: Record<string, unknown>, _userId: string) => {
    if (id === 999) throw new NotFoundError(`Task ${id} not found`);
    return { ...mockTask, ...data };
  }),
  remove: mock((id: number, _userId: string) => {
    if (id === 999) throw new NotFoundError(`Task ${id} not found`);
    return mockTask;
  }),
};

mock.module("@/server/modules/task/service", () => ({
  TaskService: serviceMock,
}));

const { app } = await import("@/server");
const client = createTestClient(app);

describe("Task Controller", () => {
  it("GET /api/tasks — returns tasks with total", async () => {
    const res = await client.request("/api/tasks");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tasks).toHaveLength(1);
    expect(data.total).toBe(1);
  });

  it("GET /api/tasks?columnId=1 — passes query params", async () => {
    const res = await client.request("/api/tasks?columnId=1&limit=10&offset=0");
    expect(res.status).toBe(200);
    expect(serviceMock.list).toHaveBeenCalledWith("test-user-id", {
      columnId: 1,
      limit: 10,
      offset: 0,
    });
  });

  it("POST /api/tasks — creates a task", async () => {
    const res = await client.json("/api/tasks", {
      title: "New task",
      columnId: 1,
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("New task");
  });

  it("POST /api/tasks — rejects empty title", async () => {
    const res = await client.json("/api/tasks", {
      title: "",
      columnId: 1,
    });
    expect(res.status).toBe(422);
  });

  it("PUT /api/tasks/:id — updates a task", async () => {
    const res = await client.json("/api/tasks/1", { title: "Updated" }, "PUT");
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Updated");
  });

  it("PUT /api/tasks/:id — returns 404 for non-existent task", async () => {
    const res = await client.json("/api/tasks/999", { title: "Nope" }, "PUT");
    expect(res.status).toBe(404);
  });

  it("DELETE /api/tasks/:id — removes the task", async () => {
    const res = await client.request("/api/tasks/1", { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(serviceMock.remove).toHaveBeenCalledWith(1, "test-user-id");
  });

  it("DELETE /api/tasks/:id — returns 404 for non-existent task", async () => {
    const res = await client.request("/api/tasks/999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
