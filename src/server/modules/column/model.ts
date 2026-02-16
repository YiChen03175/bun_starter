import { Elysia, t } from "elysia";

export const ColumnModel = new Elysia({ name: "Column.Model" }).model({
  "column.create": t.Object({
    title: t.String({ minLength: 1 }),
  }),
  "column.update": t.Object({
    title: t.Optional(t.String({ minLength: 1 })),
    position: t.Optional(t.Number({ minimum: 0 })),
  }),
  "column.id": t.Object({
    id: t.Numeric(),
  }),
});
