import { afterEach, describe, expect, it } from "bun:test";
import { NotFoundError } from "elysia";
import { defaultColumns, mockColumn } from "test/fixtures/board";
import { setQueryResult, setQueryResultFn } from "test/helpers/mock-db";

const { ColumnService } = await import("@/server/modules/column/service");

const userId = "test-user-id";

describe("ColumnService", () => {
  // Business logic for column management — all operations are scoped to a userId
  afterEach(() => {
    setQueryResultFn(null);
  });

  describe("listing columns", () => {
    it("should return existing columns when user has columns", async () => {
      // Acceptance: KB01-US1.2
      // Given the user has existing columns
      setQueryResult(defaultColumns);

      // When the service lists columns for that user
      const cols = await ColumnService.list(userId);

      // Then it should return all columns owned by the user
      expect(cols).toEqual(defaultColumns);
    });

    it("should not return another user's columns", async () => {
      // Acceptance: KB01-US5.1
      // Given user A has columns but user B has none
      let callCount = 0;
      setQueryResultFn(() => {
        callCount++;
        // First call (select for user B) returns empty → triggers default creation
        // Second call (insert .returning()) returns the new defaults
        return callCount === 1 ? [] : defaultColumns;
      });

      // When user B lists their columns
      const cols = await ColumnService.list("different-user-id");

      // Then user B should only see their own default columns, not user A's data
      expect(cols).toEqual(defaultColumns);
      expect(cols).toHaveLength(3);
    });

    it("should create default columns when user has none", async () => {
      // Acceptance: KB01-US1.1
      // Given the user has no columns yet
      let callCount = 0;
      setQueryResultFn(() => {
        callCount++;
        // First call (select) returns empty → triggers insert path
        // Second call (insert .returning()) returns the created defaults
        return callCount === 1 ? [] : defaultColumns;
      });

      // When the service lists columns for a new user
      const cols = await ColumnService.list(userId);

      // Then it should auto-create the 3 default columns (To Do, In Progress, Completed)
      expect(cols).toEqual(defaultColumns);
      expect(cols).toHaveLength(3);
      expect(callCount).toBe(2);
    });
  });

  describe("creating a column", () => {
    it("should return the created column", async () => {
      // Acceptance: KB01-US1.3
      // Given valid column data
      setQueryResult([mockColumn]);

      // When the service creates a column with title "To Do"
      const col = await ColumnService.create("To Do", userId);

      // Then the column should be persisted and returned
      expect(col).toEqual(mockColumn);
    });
  });

  describe("updating a column", () => {
    it("should return the updated column when it exists", async () => {
      // Acceptance: KB01-US1.4
      // Given a column exists that the user owns
      const updated = { ...mockColumn, title: "Done" };
      setQueryResult([updated]);

      // When the service updates column 1 with a new title
      const col = await ColumnService.update(1, { title: "Done" }, userId);

      // Then the column should be updated and returned
      expect(col).toEqual(updated);
    });

    it("should throw NotFoundError when column does not exist", async () => {
      // Acceptance: KB01-US1.4 (validation)
      // Given the column does not exist
      setQueryResult([]);

      // Then updating a non-existent column should throw NotFoundError
      await expect(
        ColumnService.update(999, { title: "Nope" }, userId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("removing a column", () => {
    it("should return the deleted column when it exists", async () => {
      // Acceptance: KB01-US1.5
      // Given a column exists that the user owns
      setQueryResult([mockColumn]);

      // When the service removes column 1
      const col = await ColumnService.remove(1, userId);

      // Then the column should be removed and its data returned
      expect(col).toEqual(mockColumn);
    });

    it("should throw NotFoundError when column does not exist", async () => {
      // Acceptance: KB01-US1.5 (validation)
      // Given the column does not exist
      setQueryResult([]);

      // Then removing a non-existent column should throw NotFoundError
      await expect(ColumnService.remove(999, userId)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("should not remove a column that belongs to a different user", async () => {
      // Acceptance: KB01-US5.2
      // Given a column exists but belongs to a different user (query returns empty due to userId mismatch)
      setQueryResult([]);

      // When another user tries to remove it
      // Then NotFoundError should be thrown because the AND(id, userId) query returns no rows
      await expect(
        ColumnService.remove(1, "different-user-id"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
