import { describe, expect, it } from "bun:test";
import { NotFoundError } from "elysia";
import { mockTask, mockTaskTwo } from "test/fixtures/board";
import { setQueryResult } from "test/helpers/mock-db";

const { TaskService } = await import("@/server/modules/task/service");

const userId = "test-user-id";

describe("TaskService", () => {
  it("list() — returns tasks with total", async () => {
    // Mock returns same result for both parallel queries (tasks + count)
    setQueryResult([Object.assign({ ...mockTask }, { total: 2 }), mockTaskTwo]);
    const result = await TaskService.list(userId, { limit: 20, offset: 0 });
    expect(result.tasks).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("list() — filters by columnId", async () => {
    setQueryResult([Object.assign({ ...mockTask }, { total: 1 })]);
    const result = await TaskService.list(userId, {
      columnId: 1,
      limit: 20,
      offset: 0,
    });
    expect(result.tasks).toHaveLength(1);
  });

  it("list() — respects pagination", async () => {
    setQueryResult([Object.assign({ ...mockTaskTwo }, { total: 1 })]);
    const result = await TaskService.list(userId, {
      limit: 1,
      offset: 1,
    });
    expect(result.tasks).toHaveLength(1);
  });

  it("create() — returns the created task", async () => {
    setQueryResult([mockTask]);
    const task = await TaskService.create(
      { title: "Implement login", columnId: 1 },
      userId,
    );
    expect(task).toEqual(mockTask);
  });

  it("create() — throws NotFoundError when column not found", async () => {
    setQueryResult([]);
    expect(
      TaskService.create({ title: "Test", columnId: 999 }, userId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("update() — returns the updated task", async () => {
    const updated = { ...mockTask, title: "Updated" };
    setQueryResult([updated]);
    const task = await TaskService.update(1, { title: "Updated" }, userId);
    expect(task).toEqual(updated);
  });

  it("update() — with column move verifies target column", async () => {
    setQueryResult([mockTask]);
    const task = await TaskService.update(1, { columnId: 2 }, userId);
    expect(task).toEqual(mockTask);
  });

  it("update() — throws NotFoundError when target column not found", async () => {
    setQueryResult([]);
    expect(
      TaskService.update(1, { columnId: 999 }, userId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("update() — throws NotFoundError when task does not exist", async () => {
    setQueryResult([]);
    expect(
      TaskService.update(999, { title: "Nope" }, userId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("remove() — returns the deleted task", async () => {
    setQueryResult([mockTask]);
    const task = await TaskService.remove(1, userId);
    expect(task).toEqual(mockTask);
  });

  it("remove() — throws NotFoundError when task does not exist", async () => {
    setQueryResult([]);
    expect(TaskService.remove(999, userId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
