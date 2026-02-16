import { describe, expect, it } from "bun:test";
import { NotFoundError } from "elysia";
import { mockTask, mockTaskTwo } from "test/fixtures/board";
import { setQueryResult } from "test/helpers/mock-db";

const { TaskService } = await import("@/server/modules/task/service");

const userId = "test-user-id";

describe("TaskService", () => {
  // Business logic for task management — tasks belong to a column and are scoped to a userId
  describe("listing tasks", () => {
    it("should return tasks with total count", async () => {
      // Given the user has two tasks
      setQueryResult([
        Object.assign({ ...mockTask }, { total: 2 }),
        mockTaskTwo,
      ]);

      // When the service lists tasks for the user
      const result = await TaskService.list(userId, { limit: 20, offset: 0 });

      // Then it should return both tasks and the correct total
      expect(result.tasks).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by columnId when provided", async () => {
      // Given the user has tasks in column 1
      setQueryResult([Object.assign({ ...mockTask }, { total: 1 })]);

      // When the service lists tasks filtered by column 1
      const result = await TaskService.list(userId, {
        columnId: 1,
        limit: 20,
        offset: 0,
      });

      // Then it should return only the matching task
      expect(result.tasks).toHaveLength(1);
    });

    it("should respect pagination parameters", async () => {
      // Given the user has tasks spanning multiple pages
      setQueryResult([Object.assign({ ...mockTaskTwo }, { total: 1 })]);

      // When the service lists tasks with offset 1 and limit 1
      const result = await TaskService.list(userId, {
        limit: 1,
        offset: 1,
      });

      // Then it should return one task from the requested page
      expect(result.tasks).toHaveLength(1);
    });
  });

  describe("creating a task", () => {
    it("should return the created task", async () => {
      // Given valid task data for column 1
      setQueryResult([mockTask]);

      // When the service creates a task in column 1
      const task = await TaskService.create(
        { title: "Implement login", columnId: 1 },
        userId,
      );

      // Then the task should be persisted and returned
      expect(task).toEqual(mockTask);
    });

    it("should throw NotFoundError when column does not exist", async () => {
      // Given the target column does not exist
      setQueryResult([]);

      // Then creating a task in a non-existent column should throw NotFoundError
      expect(
        TaskService.create({ title: "Test", columnId: 999 }, userId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("updating a task", () => {
    it("should return the updated task", async () => {
      // Given the task exists and the user owns it
      const updated = { ...mockTask, title: "Updated" };
      setQueryResult([updated]);

      // When the service updates task 1 with a new title
      const task = await TaskService.update(1, { title: "Updated" }, userId);

      // Then the task should be updated and returned
      expect(task).toEqual(updated);
    });

    it("should verify target column when moving to a different column", async () => {
      // Given the task exists and the target column is valid
      setQueryResult([mockTask]);

      // When the service moves task 1 to column 2
      const task = await TaskService.update(1, { columnId: 2 }, userId);

      // Then it should return the moved task
      expect(task).toEqual(mockTask);
    });

    it("should throw NotFoundError when target column does not exist", async () => {
      // Given the target column does not exist
      setQueryResult([]);

      // Then moving a task to a non-existent column should throw NotFoundError
      expect(
        TaskService.update(1, { columnId: 999 }, userId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should throw NotFoundError when task does not exist", async () => {
      // Given the task does not exist
      setQueryResult([]);

      // Then updating a non-existent task should throw NotFoundError
      expect(
        TaskService.update(999, { title: "Nope" }, userId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("removing a task", () => {
    it("should return the deleted task when it exists", async () => {
      // Given the task exists and the user owns it
      setQueryResult([mockTask]);

      // When the service removes task 1
      const task = await TaskService.remove(1, userId);

      // Then the task should be removed and its data returned
      expect(task).toEqual(mockTask);
    });

    it("should throw NotFoundError when task does not exist", async () => {
      // Given the task does not exist
      setQueryResult([]);

      // Then removing a non-existent task should throw NotFoundError
      expect(TaskService.remove(999, userId)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
