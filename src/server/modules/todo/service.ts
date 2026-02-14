import { eq } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { db } from "../../db";
import { todos } from "../../db/schema";
import { logger } from "../../logger";

export const TodoService = {
  list() {
    return db.select().from(todos).orderBy(todos.createdAt);
  },

  async create(title: string) {
    const [todo] = await db.insert(todos).values({ title }).returning();
    logger.info({ todoId: todo.id }, "todo created");
    return todo;
  },

  async update(id: number, data: { title?: string; completed?: boolean }) {
    const [todo] = await db
      .update(todos)
      .set(data)
      .where(eq(todos.id, id))
      .returning();
    if (!todo) throw new NotFoundError(`Todo ${id} not found`);
    logger.info({ todoId: id }, "todo updated");
    return todo;
  },

  async remove(id: number) {
    const [todo] = await db.delete(todos).where(eq(todos.id, id)).returning();
    if (!todo) throw new NotFoundError(`Todo ${id} not found`);
    logger.info({ todoId: id }, "todo removed");
    return todo;
  },
};
