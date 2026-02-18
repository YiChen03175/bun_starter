import { describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "elysia";
import { mockTask } from "test/fixtures/board";
import { createTestClient } from "test/helpers/elysia";
import "test/helpers/mock-auth";
import "test/helpers/mock-logger";

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
  // Authenticated CRUD operations on tasks — all routes require { auth: true }
  describe("GET /api/tasks", () => {
    it("should return tasks with total count", async () => {
      // Acceptance: KB01-US2.1
      // When an authenticated user sends GET /api/tasks
      const res = await client.request("/api/tasks");

      // Then it should return 200 with tasks and total count
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.tasks).toHaveLength(1);
      expect(data.total).toBe(1);
    });

    it("should pass query params to service when filtering", async () => {
      // Acceptance: KB01-US2.5
      // When an authenticated user sends GET /api/tasks with column and pagination filters
      const res = await client.request(
        "/api/tasks?columnId=1&limit=10&offset=0",
      );

      // Then it should forward the filters to the service
      expect(res.status).toBe(200);
      expect(serviceMock.list).toHaveBeenCalledWith("test-user-id", {
        columnId: 1,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("POST /api/tasks", () => {
    it("should create a task when data is valid", async () => {
      // Acceptance: KB01-US2.1
      // When an authenticated user creates a task with title and column
      const res = await client.json("/api/tasks", {
        title: "New task",
        columnId: 1,
      });

      // Then it should return 201 with the created task
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.title).toBe("New task");
    });

    it("should create a task with description when provided", async () => {
      // Acceptance: KB01-US2.2
      // When an authenticated user creates a task with a title and description
      const res = await client.json("/api/tasks", {
        title: "New task",
        columnId: 1,
        description: "Details",
      });

      // Then it should return 201 and forward the full data to the service
      expect(res.status).toBe(201);
      expect(serviceMock.create).toHaveBeenCalledWith(
        { title: "New task", columnId: 1, description: "Details" },
        "test-user-id",
      );
    });

    it("should return 422 when title is empty", async () => {
      // Acceptance: KB01-US2.4
      // When an authenticated user creates a task with an empty title
      const res = await client.json("/api/tasks", {
        title: "",
        columnId: 1,
      });

      // Then it should reject with 422 validation error
      expect(res.status).toBe(422);
    });

    it("should return 422 when columnId is missing", async () => {
      // Acceptance: KB01-US2.1 (validation)
      // When an authenticated user creates a task without a columnId
      const res = await client.json("/api/tasks", { title: "New task" });

      // Then it should reject with 422 validation error
      expect(res.status).toBe(422);
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("should update the task when it exists", async () => {
      // Acceptance: KB01-US3.2
      // When an authenticated user updates task 1 with a new title
      const res = await client.json(
        "/api/tasks/1",
        { title: "Updated" },
        "PUT",
      );

      // Then it should return 200 with the updated task
      expect(res.status).toBe(200);
      expect((await res.json()).title).toBe("Updated");
    });

    it("should move a task to a different column", async () => {
      // Acceptance: KB01-US3.2, KB01-US5.2
      // When an authenticated user moves task 1 to column 2
      const res = await client.json("/api/tasks/1", { columnId: 2 }, "PUT");

      // Then it should return 200 and forward the column change to the service
      expect(res.status).toBe(200);
      expect(serviceMock.update).toHaveBeenCalledWith(
        1,
        { columnId: 2 },
        "test-user-id",
      );
    });

    it("should return 404 when task does not exist", async () => {
      // Acceptance: KB01-US3.2 (validation)
      // When an authenticated user tries to update a non-existent task
      const res = await client.json("/api/tasks/999", { title: "Nope" }, "PUT");

      // Then it should return 404
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("should remove the task when it exists", async () => {
      // Acceptance: KB01-US2.3, KB01-US5.2
      // When an authenticated user deletes task 1
      const res = await client.request("/api/tasks/1", { method: "DELETE" });

      // Then it should return 200 and call the service with the user's id
      expect(res.status).toBe(200);
      expect(serviceMock.remove).toHaveBeenCalledWith(1, "test-user-id");
    });

    it("should return 404 when task does not exist", async () => {
      // Acceptance: KB01-US2.3 (validation)
      // When an authenticated user tries to delete a non-existent task
      const res = await client.request("/api/tasks/999", { method: "DELETE" });

      // Then it should return 404
      expect(res.status).toBe(404);
    });
  });
});
