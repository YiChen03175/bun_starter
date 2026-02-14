import { Elysia, t } from "elysia";

export const TodoModel = new Elysia({ name: "Todo.Model" }).model({
  "todo.create": t.Object({
    title: t.String({ minLength: 1 }),
  }),
  "todo.update": t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    completed: t.Optional(t.Boolean()),
  }),
  "todo.id": t.Object({
    id: t.Numeric(),
  }),
});
