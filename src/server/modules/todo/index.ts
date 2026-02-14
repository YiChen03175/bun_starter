import { Elysia } from "elysia";
import { TodoModel } from "./model";
import { TodoService } from "./service";

export const todoController = new Elysia({ prefix: "/todos" })
  .use(TodoModel)
  .get("/", () => TodoService.list())
  .post("/", ({ body }) => TodoService.create(body.title), {
    body: "todo.create",
  })
  .put("/:id", ({ params, body }) => TodoService.update(params.id, body), {
    params: "todo.id",
    body: "todo.update",
  })
  .delete("/:id", ({ params }) => TodoService.remove(params.id), {
    params: "todo.id",
  });
