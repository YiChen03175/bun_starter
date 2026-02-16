import { describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import {
  createQueryWrapper,
  EdenProvider,
  useEden,
  useEdenClient,
} from "test/helpers/eden-query";

mock.module("@/lib/eden", () => ({
  api: {},
  EdenProvider,
  useEden,
  useEdenClient,
}));

const { TableView } = await import("@/app/board/_components/table-view");

const columns = [
  { id: 1, title: "To Do" },
  { id: 2, title: "In Progress" },
];

const mockTasks = [
  {
    id: 1,
    title: "Implement login",
    description: null,
    columnId: 1,
    position: 0,
    userId: "u1",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    title: "Write tests",
    description: "Unit tests",
    columnId: 2,
    position: 0,
    userId: "u1",
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
];

function createMockClient(
  overrides: { getTasks?: () => Promise<unknown> } = {},
) {
  const getTasks =
    overrides.getTasks ??
    (() =>
      Promise.resolve({
        data: { tasks: mockTasks, total: 2 },
        error: null,
      }));

  return {
    api: {
      tasks: Object.assign(
        (_params: { id: number }) => ({
          put: () => Promise.resolve({ data: {}, error: null }),
          delete: () => Promise.resolve({ data: {}, error: null }),
        }),
        {
          get: () => getTasks(),
          post: () => Promise.resolve({ data: {}, error: null }),
        },
      ),
    },
  };
}

function renderTableView(overrides?: Parameters<typeof createMockClient>[0]) {
  const mockClient = createMockClient(overrides);
  const { Wrapper } = createQueryWrapper(mockClient);
  return render(<TableView columns={columns} />, { wrapper: Wrapper });
}

describe("TableView", () => {
  it("shows loading state initially", () => {
    renderTableView({
      getTasks: () => new Promise(() => {}),
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders tasks in table", async () => {
    renderTableView();
    await waitFor(() => {
      expect(screen.getByText("Implement login")).toBeInTheDocument();
    });
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("shows empty state when no tasks", async () => {
    renderTableView({
      getTasks: () =>
        Promise.resolve({ data: { tasks: [], total: 0 }, error: null }),
    });
    await waitFor(() => {
      expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
    });
  });

  it("shows pagination info", async () => {
    renderTableView();
    await waitFor(() => {
      expect(screen.getByText("Showing 1-2 of 2")).toBeInTheDocument();
    });
  });

  it("shows error state when query fails", async () => {
    renderTableView({
      getTasks: () => Promise.reject(new Error("Server Error")),
    });
    await waitFor(() => {
      expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
    });
  });
});
