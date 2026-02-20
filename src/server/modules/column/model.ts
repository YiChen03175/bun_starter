import type { Static } from "@sinclair/typebox";
import { Elysia, t } from "elysia";

export const ColumnCreateSchema = t.Object({
  title: t.String({ minLength: 1 }),
});

export const ColumnUpdateSchema = t.Object({
  title: t.Optional(t.String({ minLength: 1 })),
  position: t.Optional(t.Number({ minimum: 0 })),
});

export const ColumnIdSchema = t.Object({
  id: t.Numeric(),
});

export type ColumnCreate = Static<typeof ColumnCreateSchema>;
export type ColumnUpdate = Static<typeof ColumnUpdateSchema>;
export type ColumnId = Static<typeof ColumnIdSchema>;

export const ColumnModel = new Elysia({ name: "Column.Model" }).model({
  "column.create": ColumnCreateSchema,
  "column.update": ColumnUpdateSchema,
  "column.id": ColumnIdSchema,
});
