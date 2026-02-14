import type { SelectTodo } from "@/server/db/schema";

// Full DB-shaped fixtures for backend tests
export const mockSelectTodo: SelectTodo = {
  id: 1,
  title: "Buy milk",
  completed: false,
  userId: "test-user-id",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const completedSelectTodo: SelectTodo = {
  id: 2,
  title: "Walk dog",
  completed: true,
  userId: "test-user-id",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-02"),
};

// Simple fixtures for component tests (TodoItem only needs id/title/completed)
export const mockTodo = { id: 1, title: "Buy milk", completed: false };
export const completedTodo = { id: 2, title: "Walk dog", completed: true };
