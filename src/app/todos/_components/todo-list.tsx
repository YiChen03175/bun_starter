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
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    const { data, error } = await api.api.todos.get();
    if (error) {
      setError("Failed to load todos");
      setLoading(false);
      return;
    }
    setTodos(data);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = async (title: string) => {
    const { error } = await api.api.todos.post({ title });
    if (error) throw error;
    fetchTodos();
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    const { error } = await api.api
      .todos({ id })
      .put({ completed: !completed });
    if (error) {
      setError("Failed to update todo");
      return;
    }
    fetchTodos();
  };

  const deleteTodo = async (id: number) => {
    const { error } = await api.api.todos({ id }).delete();
    if (error) {
      setError("Failed to delete todo");
      return;
    }
    fetchTodos();
  };

  return (
    <div className="space-y-4">
      <TodoForm onAdd={createTodo} />

      {error && <p className="text-destructive text-sm">{error}</p>}

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
