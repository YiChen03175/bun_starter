import { and, eq } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { logger } from "@/server/logger";

export const TodoService = {
  list(userId: string) {
    return db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(todos.createdAt);
  },

  async create(title: string, userId: string) {
    const [todo] = await db.insert(todos).values({ title, userId }).returning();
    logger.info({ todoId: todo.id }, "todo created");
    return todo;
  },

  async update(
    id: number,
    data: { title?: string; completed?: boolean },
    userId: string,
  ) {
    const [todo] = await db
      .update(todos)
      .set(data)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();
    if (!todo) throw new NotFoundError(`Todo ${id} not found`);
    logger.info({ todoId: id }, "todo updated");
    return todo;
  },

  async remove(id: number, userId: string) {
    const [todo] = await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();
    if (!todo) throw new NotFoundError(`Todo ${id} not found`);
    logger.info({ todoId: id }, "todo removed");
    return todo;
  },
};
