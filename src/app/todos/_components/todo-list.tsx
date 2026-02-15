"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEden, useEdenClient } from "@/lib/eden";
import { TodoForm } from "./todo-form";
import { TodoItem } from "./todo-item";

export function TodoList() {
  const eden = useEden();
  const edenClient = useEdenClient();
  const qc = useQueryClient();

  const todosQueryKey = eden.api.todos.get.queryKey();

  const {
    data: todos,
    isLoading,
    error,
  } = useQuery(eden.api.todos.get.queryOptions());

  const createMutation = useMutation({
    ...eden.api.todos.post.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: todosQueryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: number;
      completed: boolean;
    }) => {
      const { data, error } = await edenClient.api
        .todos({ id })
        .put({ completed });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: todosQueryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await edenClient.api.todos({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: todosQueryKey }),
  });

  const createTodo = async (title: string) => {
    createMutation.reset();
    await createMutation.mutateAsync({ title });
  };

  const toggleTodo = (id: number, completed: boolean) => {
    updateMutation.reset();
    updateMutation.mutate({ id, completed: !completed });
  };

  const deleteTodo = (id: number) => {
    deleteMutation.reset();
    deleteMutation.mutate(id);
  };

  const mutationError =
    createMutation.error || updateMutation.error || deleteMutation.error;

  return (
    <div className="space-y-4">
      <TodoForm onAdd={createTodo} />

      {(error || mutationError) && (
        <p className="text-destructive text-sm">
          {error
            ? "Failed to load todos"
            : mutationError instanceof Error
              ? mutationError.message
              : "An error occurred"}
        </p>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !todos || todos.length === 0 ? (
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
