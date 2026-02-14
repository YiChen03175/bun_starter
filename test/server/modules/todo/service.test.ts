import { describe, expect, it } from "bun:test";
import { NotFoundError } from "elysia";
import { completedSelectTodo, mockSelectTodo } from "test/fixtures/todo";
import { setQueryResult } from "test/helpers/mock-db";

const { TodoService } = await import("@/server/modules/todo/service");

const userId = "test-user-id";

describe("TodoService", () => {
  it("list() — returns todos", async () => {
    setQueryResult([mockSelectTodo, completedSelectTodo]);
    const todos = await TodoService.list(userId);
    expect(todos).toEqual([mockSelectTodo, completedSelectTodo]);
  });

  it("create() — returns the created todo", async () => {
    setQueryResult([mockSelectTodo]);
    const todo = await TodoService.create("Buy milk", userId);
    expect(todo).toEqual(mockSelectTodo);
  });

  it("update() — returns the updated todo", async () => {
    setQueryResult([completedSelectTodo]);
    const todo = await TodoService.update(2, { completed: true }, userId);
    expect(todo).toEqual(completedSelectTodo);
  });

  it("update() — throws NotFoundError when todo does not exist", async () => {
    setQueryResult([]);
    expect(
      TodoService.update(999, { completed: true }, userId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("remove() — returns the deleted todo", async () => {
    setQueryResult([mockSelectTodo]);
    const todo = await TodoService.remove(1, userId);
    expect(todo).toEqual(mockSelectTodo);
  });

  it("remove() — throws NotFoundError when todo does not exist", async () => {
    setQueryResult([]);
    expect(TodoService.remove(999, userId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
