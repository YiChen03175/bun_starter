import { Elysia } from "elysia";
import { betterAuthPlugin } from "@/server/plugins/auth";
import { TodoModel } from "./model";
import { TodoService } from "./service";

export const todoController = new Elysia({ prefix: "/todos" })
  .use(TodoModel)
  .use(betterAuthPlugin)
  .get("/", ({ user }) => TodoService.list(user.id), { auth: true })
  .post(
    "/",
    async ({ body, set, user }) => {
      set.status = 201;
      return TodoService.create(body.title, user.id);
    },
    { body: "todo.create", auth: true },
  )
  .put(
    "/:id",
    ({ params, body, user }) => TodoService.update(params.id, body, user.id),
    {
      params: "todo.id",
      body: "todo.update",
      auth: true,
    },
  )
  .delete(
    "/:id",
    ({ params, user }) => TodoService.remove(params.id, user.id),
    {
      params: "todo.id",
      auth: true,
    },
  );
