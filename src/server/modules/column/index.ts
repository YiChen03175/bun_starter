import { Elysia } from "elysia";
import { betterAuthPlugin } from "@/server/plugins/auth";
import { ColumnModel } from "./model";
import { ColumnService } from "./service";

export const columnController = new Elysia({
  prefix: "/columns",
  name: "Column.Controller",
})
  .use(ColumnModel)
  .use(betterAuthPlugin)
  .get("/", ({ user }) => ColumnService.list(user.id), { auth: true })
  .post(
    "/",
    async ({ body, set, user }) => {
      set.status = 201;
      return ColumnService.create(body.title, user.id);
    },
    { body: "column.create", auth: true },
  )
  .put(
    "/:id",
    ({ params, body, user }) => ColumnService.update(params.id, body, user.id),
    {
      params: "column.id",
      body: "column.update",
      auth: true,
    },
  )
  .delete(
    "/:id",
    ({ params, user }) => ColumnService.remove(params.id, user.id),
    {
      params: "column.id",
      auth: true,
    },
  );
