"use client";

import type { Treaty } from "@elysiajs/eden";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/eden";
import { TodoForm } from "./todo-form";
import { TodoItem } from "./todo-item";

type Todo = NonNullable<Treaty.Data<typeof api.api.todos.get>>[number];

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    const { data } = await api.api.todos.get();
    if (data) setTodos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = async (title: string) => {
    await api.api.todos.post({ title });
    fetchTodos();
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    await api.api.todos({ id }).put({ completed: !completed });
    fetchTodos();
  };

  const deleteTodo = async (id: number) => {
    await api.api.todos({ id }).delete();
    fetchTodos();
  };

  return (
    <div className="space-y-4">
      <TodoForm onAdd={createTodo} />

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : todos.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No todos yet. Add one above!
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
