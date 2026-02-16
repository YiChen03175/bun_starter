import { Elysia } from "elysia";
import { betterAuthPlugin } from "@/server/plugins/auth";
import { TaskModel } from "./model";
import { TaskService } from "./service";

export const taskController = new Elysia({ prefix: "/tasks" })
  .use(TaskModel)
  .use(betterAuthPlugin)
  .get(
    "/",
    ({ query, user }) =>
      TaskService.list(user.id, {
        columnId: query.columnId,
        limit: query.limit,
        offset: query.offset,
      }),
    { query: "task.listQuery", auth: true },
  )
  .post(
    "/",
    async ({ body, set, user }) => {
      set.status = 201;
      return TaskService.create(body, user.id);
    },
    { body: "task.create", auth: true },
  )
  .put(
    "/:id",
    ({ params, body, user }) => TaskService.update(params.id, body, user.id),
    {
      params: "task.id",
      body: "task.update",
      auth: true,
    },
  )
  .delete(
    "/:id",
    ({ params, user }) => TaskService.remove(params.id, user.id),
    {
      params: "task.id",
      auth: true,
    },
  );
