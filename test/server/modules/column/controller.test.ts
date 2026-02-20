import { describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "elysia";
import { defaultColumns, mockColumn } from "test/fixtures/board";
import { createTestClient } from "test/helpers/elysia";
import type { ColumnUpdate } from "@/server/modules/column/model";
import "test/helpers/mock-auth";
import "test/helpers/mock-logger";

const serviceMock = {
  list: mock((_userId: string) => defaultColumns),
  create: mock((title: string, _userId: string) => ({
    ...mockColumn,
    title,
  })),
  update: mock((id: number, data: ColumnUpdate, _userId: string) => {
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
  // Authenticated CRUD operations on columns — all routes require { auth: true }
  describe("GET /api/columns", () => {
    it("should return a list of columns", async () => {
      // Acceptance: KB01-US1.2
      // When an authenticated user sends GET /api/columns
      const res = await client.request("/api/columns");

      // Then it should return 200 with all the user's columns
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      expect(serviceMock.list).toHaveBeenCalledWith("test-user-id");
    });
  });

  describe("POST /api/columns", () => {
    it("should create a column when title is valid", async () => {
      // Acceptance: KB01-US1.3
      // When an authenticated user creates a column with title "Backlog"
      const res = await client.json("/api/columns", { title: "Backlog" });

      // Then it should return 201 with the created column
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.title).toBe("Backlog");
      expect(serviceMock.create).toHaveBeenCalledWith(
        "Backlog",
        "test-user-id",
      );
    });

    it("should return 422 when title is empty", async () => {
      // Acceptance: KB01-US1.6
      // When an authenticated user creates a column with an empty title
      const res = await client.json("/api/columns", { title: "" });

      // Then it should reject with 422 validation error
      expect(res.status).toBe(422);
    });
  });

  describe("PUT /api/columns/:id", () => {
    it("should update the column when it exists", async () => {
      // Acceptance: KB01-US1.4
      // When an authenticated user updates column 1 with a new title
      const res = await client.json("/api/columns/1", { title: "Done" }, "PUT");

      // Then it should return 200 with the updated column
      expect(res.status).toBe(200);
      expect((await res.json()).title).toBe("Done");
      expect(serviceMock.update).toHaveBeenCalledWith(
        1,
        { title: "Done" },
        "test-user-id",
      );
    });

    it("should update the column position when position is provided", async () => {
      // Acceptance: KB01-US1.4
      // When an authenticated user updates column 1 with a new position
      const res = await client.json("/api/columns/1", { position: 2 }, "PUT");

      // Then it should return 200 and forward the position to the service
      expect(res.status).toBe(200);
      expect(serviceMock.update).toHaveBeenCalledWith(
        1,
        { position: 2 },
        "test-user-id",
      );
    });

    it("should return 404 when column does not exist", async () => {
      // Acceptance: KB01-US1.4 (validation)
      // When an authenticated user tries to update a non-existent column
      const res = await client.json(
        "/api/columns/999",
        { title: "Nope" },
        "PUT",
      );

      // Then it should return 404
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/columns/:id", () => {
    it("should remove the column when it exists", async () => {
      // Acceptance: KB01-US1.5, KB01-US5.2
      // When an authenticated user deletes column 1
      const res = await client.request("/api/columns/1", { method: "DELETE" });

      // Then it should return 200 and call the service with the user's id
      expect(res.status).toBe(200);
      expect(serviceMock.remove).toHaveBeenCalledWith(1, "test-user-id");
    });

    it("should return 404 when column does not exist", async () => {
      // Acceptance: KB01-US1.5 (validation)
      // When an authenticated user tries to delete a non-existent column
      const res = await client.request("/api/columns/999", {
        method: "DELETE",
      });

      // Then it should return 404
      expect(res.status).toBe(404);
    });
  });
});
