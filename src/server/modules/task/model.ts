import type { Static } from "@sinclair/typebox";
import { Elysia, t } from "elysia";

export const TaskCreateSchema = t.Object({
  title: t.String({ minLength: 1 }),
  columnId: t.Number(),
  description: t.Optional(t.String()),
});

export const TaskUpdateSchema = t.Object({
  title: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  columnId: t.Optional(t.Number()),
  position: t.Optional(t.Number({ minimum: 0 })),
});

export const TaskIdSchema = t.Object({
  id: t.Numeric(),
});

export const TaskListQuerySchema = t.Object({
  columnId: t.Optional(t.Numeric()),
  limit: t.Numeric({ default: 20 }),
  offset: t.Numeric({ default: 0 }),
});

export type TaskCreate = Static<typeof TaskCreateSchema>;
export type TaskUpdate = Static<typeof TaskUpdateSchema>;
export type TaskId = Static<typeof TaskIdSchema>;
export type TaskListQuery = Static<typeof TaskListQuerySchema>;

export const TaskModel = new Elysia({ name: "Task.Model" }).model({
  "task.create": TaskCreateSchema,
  "task.update": TaskUpdateSchema,
  "task.id": TaskIdSchema,
  "task.listQuery": TaskListQuerySchema,
});
