import type { SelectColumn, SelectTask } from "@/server/db/schema";

export const mockColumn: SelectColumn = {
  id: 1,
  title: "To Do",
  position: 0,
  userId: "test-user-id",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const defaultColumns: SelectColumn[] = [
  mockColumn,
  {
    id: 2,
    title: "In Progress",
    position: 1,
    userId: "test-user-id",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    title: "Completed",
    position: 2,
    userId: "test-user-id",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

export const mockTask: SelectTask = {
  id: 1,
  title: "Implement login",
  description: null,
  columnId: 1,
  position: 0,
  userId: "test-user-id",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockTaskTwo: SelectTask = {
  id: 2,
  title: "Write tests",
  description: "Unit and integration tests",
  columnId: 1,
  position: 1,
  userId: "test-user-id",
  createdAt: new Date("2025-01-02"),
  updatedAt: new Date("2025-01-02"),
};

export const mockTaskInProgress: SelectTask = {
  id: 3,
  title: "Design UI",
  description: null,
  columnId: 2,
  position: 0,
  userId: "test-user-id",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};
