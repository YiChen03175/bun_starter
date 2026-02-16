import { describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultColumns } from "test/fixtures/board";
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

const { BoardShell } = await import("@/app/board/_components/board-shell");

const simpleColumns = defaultColumns.map((c) => ({
  id: c.id,
  title: c.title,
  position: c.position,
  userId: c.userId,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
}));

function createMockClient(
  overrides: {
    getColumns?: () => Promise<unknown>;
    getTasks?: () => Promise<unknown>;
  } = {},
) {
  const getColumns =
    overrides.getColumns ??
    (() => Promise.resolve({ data: simpleColumns, error: null }));
  const getTasks =
    overrides.getTasks ??
    (() =>
      Promise.resolve({
        data: { tasks: [], total: 0 },
        error: null,
      }));

  return {
    api: {
      columns: Object.assign(
        (_params: { id: number }) => ({
          put: () => Promise.resolve({ data: {}, error: null }),
          delete: () => Promise.resolve({ data: {}, error: null }),
        }),
        {
          get: () => getColumns(),
          post: () => Promise.resolve({ data: {}, error: null }),
        },
      ),
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

function renderBoardShell(
  clientOverrides?: Parameters<typeof createMockClient>[0],
) {
  const mockClient = createMockClient(clientOverrides);
  const { Wrapper, queryClient } = createQueryWrapper(mockClient);
  const result = render(<BoardShell />, { wrapper: Wrapper });
  return { ...result, queryClient };
}

describe("BoardShell", () => {
  it("shows loading state initially", () => {
    renderBoardShell({
      getColumns: () => new Promise(() => {}),
    });
    expect(screen.getByText("Loading board...")).toBeInTheDocument();
  });

  it("renders kanban view by default with columns", async () => {
    renderBoardShell();
    await waitFor(() => {
      expect(screen.getByText("To Do")).toBeInTheDocument();
    });
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    renderBoardShell({
      getColumns: () =>
        Promise.resolve({
          data: null,
          error: { status: 500, value: "Server Error" },
        }),
    });
    await waitFor(() => {
      expect(screen.getByText("Failed to load board")).toBeInTheDocument();
    });
  });

  it("toggles to table view and shows table headers", async () => {
    const user = userEvent.setup();
    renderBoardShell();

    await waitFor(() => {
      expect(screen.getByText("To Do")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Table" }));

    await waitFor(() => {
      expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
    });

    // Kanban-specific elements (add task form, column badges) should be gone
    expect(
      screen.queryByPlaceholderText("Add a task..."),
    ).not.toBeInTheDocument();
  });
});
