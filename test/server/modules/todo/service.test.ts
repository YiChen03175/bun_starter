import { describe, expect, it } from "bun:test";
import { completedSelectTodo, mockSelectTodo } from "test/fixtures/todo";
import { setQueryResult } from "test/helpers/mock-db";

const { TodoService } = await import("@/server/modules/todo/service");

describe("TodoService", () => {
  it("list() — returns todos", async () => {
    setQueryResult([mockSelectTodo, completedSelectTodo]);
    const todos = await TodoService.list();
    expect(todos).toEqual([mockSelectTodo, completedSelectTodo]);
  });

  it("create() — returns the created todo", async () => {
    setQueryResult([mockSelectTodo]);
    const todo = await TodoService.create("Buy milk");
    expect(todo).toEqual(mockSelectTodo);
  });

  it("update() — returns the updated todo", async () => {
    setQueryResult([completedSelectTodo]);
    const todo = await TodoService.update(2, { completed: true });
    expect(todo).toEqual(completedSelectTodo);
  });

  it("remove() — returns the deleted todo", async () => {
    setQueryResult([mockSelectTodo]);
    const todo = await TodoService.remove(1);
    expect(todo).toEqual(mockSelectTodo);
  });
});
