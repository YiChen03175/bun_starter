import { Elysia, t } from "elysia";

export const TaskModel = new Elysia({ name: "Task.Model" }).model({
  "task.create": t.Object({
    title: t.String({ minLength: 1 }),
    columnId: t.Number(),
    description: t.Optional(t.String()),
  }),
  "task.update": t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    description: t.Optional(t.String()),
    columnId: t.Optional(t.Number()),
    position: t.Optional(t.Number({ minimum: 0 })),
  }),
  "task.id": t.Object({
    id: t.Numeric(),
  }),
  "task.listQuery": t.Object({
    columnId: t.Optional(t.Numeric()),
    limit: t.Numeric({ default: 20 }),
    offset: t.Numeric({ default: 0 }),
  }),
});
