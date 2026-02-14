import { describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "elysia";
import { mockSelectTodo } from "test/fixtures/todo";
import { createTestClient } from "test/helpers/elysia";

const serviceMock = {
  list: mock(() => [mockSelectTodo]),
  create: mock((title: string) => ({ ...mockSelectTodo, title })),
  update: mock((id: number, data: Record<string, unknown>) => {
    if (id === 999) throw new NotFoundError(`Todo ${id} not found`);
    return { ...mockSelectTodo, ...data };
  }),
  remove: mock((id: number) => {
    if (id === 999) throw new NotFoundError(`Todo ${id} not found`);
    return mockSelectTodo;
  }),
};

mock.module("@/server/modules/todo/service", () => ({
  TodoService: serviceMock,
}));

const { app } = await import("@/server");
const client = createTestClient(app);

describe("Todo Controller", () => {
  it("GET /api/todos — returns an array", async () => {
    const res = await client.request("/api/todos");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].title).toBe(mockSelectTodo.title);
  });

  it("POST /api/todos — creates a todo", async () => {
    const res = await client.json("/api/todos", { title: "Test todo" });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("Test todo");
  });

  it("POST /api/todos — rejects empty title", async () => {
    const res = await client.json("/api/todos", { title: "" });
    expect(res.status).toBe(422);
  });

  it("PUT /api/todos/:id — updates a todo", async () => {
    const res = await client.json("/api/todos/1", { completed: true }, "PUT");
    expect(res.status).toBe(200);
    expect((await res.json()).completed).toBe(true);
  });

  it("PUT /api/todos/:id — returns 404 for non-existent todo", async () => {
    const res = await client.json("/api/todos/999", { completed: true }, "PUT");
    expect(res.status).toBe(404);
  });

  it("DELETE /api/todos/:id — removes the todo", async () => {
    const res = await client.request("/api/todos/1", { method: "DELETE" });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/todos/:id — returns 404 for non-existent todo", async () => {
    const res = await client.request("/api/todos/999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
