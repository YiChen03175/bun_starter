import { and, count, desc, eq, max } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { db } from "@/server/db";
import { columns, tasks } from "@/server/db/schema";
import { logger } from "@/server/logger";

export const TaskService = {
  async list(
    userId: string,
    opts: { columnId?: number; limit: number; offset: number },
  ) {
    const where = opts.columnId
      ? and(eq(tasks.userId, userId), eq(tasks.columnId, opts.columnId))
      : eq(tasks.userId, userId);

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(where)
        .orderBy(desc(tasks.updatedAt))
        .limit(opts.limit)
        .offset(opts.offset),
      db.select({ total: count() }).from(tasks).where(where),
    ]);

    return { tasks: rows, total };
  },

  async create(
    data: { title: string; columnId: number; description?: string },
    userId: string,
  ) {
    // Verify the column belongs to the user
    const [col] = await db
      .select({ id: columns.id })
      .from(columns)
      .where(and(eq(columns.id, data.columnId), eq(columns.userId, userId)));
    if (!col) throw new NotFoundError(`Column ${data.columnId} not found`);

    // Position calculation is not wrapped in a transaction, so concurrent
    // creates may get the same position. This is acceptable because the UI
    // sorts by updatedAt, and positions aren't unique-constrained.
    const [{ maxPos }] = await db
      .select({ maxPos: max(tasks.position) })
      .from(tasks)
      .where(eq(tasks.columnId, data.columnId));
    const position = (maxPos ?? -1) + 1;

    const [task] = await db
      .insert(tasks)
      .values({ ...data, position, userId })
      .returning();
    logger.info({ taskId: task.id }, "task created");
    return task;
  },

  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      columnId?: number;
      position?: number;
    },
    userId: string,
  ) {
    // If moving to a different column, verify ownership
    if (data.columnId !== undefined) {
      const [col] = await db
        .select({ id: columns.id })
        .from(columns)
        .where(and(eq(columns.id, data.columnId), eq(columns.userId, userId)));
      if (!col) throw new NotFoundError(`Column ${data.columnId} not found`);
    }

    const [task] = await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    if (!task) throw new NotFoundError(`Task ${id} not found`);
    logger.info({ taskId: id }, "task updated");
    return task;
  },

  async remove(id: number, userId: string) {
    const [task] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    if (!task) throw new NotFoundError(`Task ${id} not found`);
    logger.info({ taskId: id }, "task removed");
    return task;
  },
};
