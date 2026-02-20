import { and, asc, eq, max } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { db } from "@/server/db";
import { columns } from "@/server/db/schema";
import { logger } from "@/server/logger";
import type { ColumnUpdate } from "./model";

const DEFAULT_COLUMNS = [
  { title: "To Do", position: 0 },
  { title: "In Progress", position: 1 },
  { title: "Completed", position: 2 },
];

export const ColumnService = {
  async list(userId: string) {
    const rows = await db
      .select()
      .from(columns)
      .where(eq(columns.userId, userId))
      .orderBy(asc(columns.position));

    if (rows.length > 0) return rows;

    // Lazy init: create default columns for new users.
    // Note: concurrent first requests for the same user could race here and
    // create duplicate defaults. A transaction + unique constraint would fix
    // this, but in practice the window is tiny and the columns are still usable.
    const created = await db
      .insert(columns)
      .values(DEFAULT_COLUMNS.map((c) => ({ ...c, userId })))
      .returning();
    logger.info({ userId }, "default columns created");
    return created;
  },

  async create(title: string, userId: string) {
    const [{ maxPos }] = await db
      .select({ maxPos: max(columns.position) })
      .from(columns)
      .where(eq(columns.userId, userId));
    const position = (maxPos ?? -1) + 1;

    const [column] = await db
      .insert(columns)
      .values({ title, position, userId })
      .returning();
    logger.info({ columnId: column.id }, "column created");
    return column;
  },

  async update(id: number, data: ColumnUpdate, userId: string) {
    const [column] = await db
      .update(columns)
      .set(data)
      .where(and(eq(columns.id, id), eq(columns.userId, userId)))
      .returning();
    if (!column) throw new NotFoundError(`Column ${id} not found`);
    logger.info({ columnId: id }, "column updated");
    return column;
  },

  async remove(id: number, userId: string) {
    const [column] = await db
      .delete(columns)
      .where(and(eq(columns.id, id), eq(columns.userId, userId)))
      .returning();
    if (!column) throw new NotFoundError(`Column ${id} not found`);
    logger.info({ columnId: id }, "column removed");
    return column;
  },
};
