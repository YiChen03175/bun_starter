import { describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "elysia";
import { defaultColumns, mockColumn } from "test/fixtures/board";
import { createTestClient } from "test/helpers/elysia";
import "test/helpers/mock-auth";
import "test/helpers/mock-logger";

const serviceMock = {
  list: mock((_userId: string) => defaultColumns),
  create: mock((title: string, _userId: string) => ({
    ...mockColumn,
    title,
  })),
  update: mock((id: number, data: Record<string, unknown>, _userId: string) => {
    if (id === 999) throw new NotFoundError(`Column ${id} not found`);
    return { ...mockColumn, ...data };
  }),
  remove: mock((id: number, _userId: string) => {
    if (id === 999) throw new NotFoundError(`Column ${id} not found`);
    return mockColumn;
  }),
};

mock.module("@/server/modules/column/service", () => ({
  ColumnService: serviceMock,
}));

const { app } = await import("@/server");
const client = createTestClient(app);

describe("Column Controller", () => {
  it("GET /api/columns — returns an array", async () => {
    const res = await client.request("/api/columns");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
    expect(serviceMock.list).toHaveBeenCalledWith("test-user-id");
  });

  it("POST /api/columns — creates a column", async () => {
    const res = await client.json("/api/columns", { title: "Backlog" });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("Backlog");
    expect(serviceMock.create).toHaveBeenCalledWith("Backlog", "test-user-id");
  });

  it("POST /api/columns — rejects empty title", async () => {
    const res = await client.json("/api/columns", { title: "" });
    expect(res.status).toBe(422);
  });

  it("PUT /api/columns/:id — updates a column", async () => {
    const res = await client.json("/api/columns/1", { title: "Done" }, "PUT");
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Done");
    expect(serviceMock.update).toHaveBeenCalledWith(
      1,
      { title: "Done" },
      "test-user-id",
    );
  });

  it("PUT /api/columns/:id — returns 404 for non-existent column", async () => {
    const res = await client.json("/api/columns/999", { title: "Nope" }, "PUT");
    expect(res.status).toBe(404);
  });

  it("DELETE /api/columns/:id — removes the column", async () => {
    const res = await client.request("/api/columns/1", { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(serviceMock.remove).toHaveBeenCalledWith(1, "test-user-id");
  });

  it("DELETE /api/columns/:id — returns 404 for non-existent column", async () => {
    const res = await client.request("/api/columns/999", {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });
});
