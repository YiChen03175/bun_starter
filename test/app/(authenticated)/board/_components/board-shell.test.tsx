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

mock.module("@/lib/eden", () => ({ api: {} }));
mock.module("@/lib/eden-query", () => ({
  EdenProvider,
  useEden,
  useEdenClient,
}));

const { BoardShell } = await import(
  "@/app/(authenticated)/board/_components/board-shell"
);

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
  // Main board orchestrator — manages columns, view switching, and column mutations
  describe("loading and rendering", () => {
    it("should show loading state initially", () => {
      // Given + When the board shell is rendered with a query that never resolves
      renderBoardShell({
        getColumns: () => new Promise(() => {}),
      });

      // Then it should display the loading message
      expect(screen.getByText("Loading board...")).toBeInTheDocument();
    });

    it("should render kanban view with columns by default", async () => {
      // Acceptance: KB01-US1.2
      // Given + When the board shell is rendered with default columns
      renderBoardShell();

      // Then it should display all three default columns in kanban view
      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should show error state when fetch fails", async () => {
      // Acceptance: KB01-CC3
      // Given + When the board shell is rendered and the columns API returns an error
      renderBoardShell({
        getColumns: () =>
          Promise.resolve({
            data: null,
            error: { status: 500, value: "Server Error" },
          }),
      });

      // Then it should display the error message
      await waitFor(() => {
        expect(screen.getByText("Failed to load board")).toBeInTheDocument();
      });
    });
  });

  describe("view switching", () => {
    it("should switch to table view when table button is clicked", async () => {
      // Acceptance: KB01-US4.1
      // Given the board is rendered in kanban view with columns loaded
      const user = userEvent.setup();
      renderBoardShell();
      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // When the user clicks the Table view button
      await user.click(screen.getByRole("button", { name: "Table" }));

      // Then the table view should be displayed with its empty state
      await waitFor(() => {
        expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
      });
      expect(
        screen.queryByPlaceholderText("Add a task..."),
      ).not.toBeInTheDocument();
    });

    it("should switch back to board view from table view", async () => {
      // Acceptance: KB01-US4.4
      // Given the board is in table view
      const user = userEvent.setup();
      renderBoardShell();
      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: "Table" }));
      await waitFor(() => {
        expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
      });

      // When the user clicks the Board view button
      await user.click(screen.getByRole("button", { name: "Board" }));

      // Then the kanban view should be displayed with the column creation form
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("New column..."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("column mutations", () => {
    it("should call create column mutation when form is submitted", async () => {
      // Acceptance: KB01-US1.3
      // Given the board is rendered and a mock create column endpoint is set up
      const postMock = mock(() => Promise.resolve({ data: {}, error: null }));
      const mockClient = createMockClient();
      mockClient.api.columns.post = postMock;
      const { Wrapper } = createQueryWrapper(mockClient);
      render(<BoardShell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // When the user types a new column name and presses Enter
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText("New column...");
      await user.type(input, "Backlog");
      await user.type(input, "{Enter}");

      // Then a new column should be created via the API
      await waitFor(() => {
        expect(postMock).toHaveBeenCalledWith({ title: "Backlog" });
      });
    });

    it("should call rename column mutation when title is edited", async () => {
      // Acceptance: KB01-US1.4
      // Given the board is rendered and a mock rename column endpoint is set up
      const putMock = mock(() => Promise.resolve({ data: {}, error: null }));
      const mockClient = createMockClient();
      const originalColumns = mockClient.api.columns;
      mockClient.api.columns = Object.assign(
        (_params: { id: number }) => ({
          put: putMock,
          delete: () => Promise.resolve({ data: {}, error: null }),
        }),
        { get: originalColumns.get, post: originalColumns.post },
      );
      const { Wrapper } = createQueryWrapper(mockClient);
      render(<BoardShell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // When the user clicks the column title, clears it, types a new name, and presses Enter
      const user = userEvent.setup();
      await user.click(screen.getByText("To Do"));
      const input = screen.getByDisplayValue("To Do");
      await user.clear(input);
      await user.type(input, "Done{Enter}");

      // Then the column should be renamed via the API
      await waitFor(() => {
        expect(putMock).toHaveBeenCalledWith({ title: "Done" });
      });
    });

    it("should call delete column mutation when delete button is clicked", async () => {
      // Acceptance: KB01-US1.5
      // Given the board is rendered and a mock delete column endpoint is set up
      const deleteMock = mock(() => Promise.resolve({ data: {}, error: null }));
      const mockClient = createMockClient();
      const originalColumns = mockClient.api.columns;
      mockClient.api.columns = Object.assign(
        (_params: { id: number }) => ({
          put: () => Promise.resolve({ data: {}, error: null }),
          delete: deleteMock,
        }),
        { get: originalColumns.get, post: originalColumns.post },
      );
      const { Wrapper } = createQueryWrapper(mockClient);
      render(<BoardShell />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // When the user clicks the delete button on the first column
      const user = userEvent.setup();
      const deleteButtons = screen.getAllByRole("button", {
        name: "Delete column",
      });
      await user.click(deleteButtons[0]);

      // Then the column should be deleted via the API
      await waitFor(() => {
        expect(deleteMock).toHaveBeenCalled();
      });
    });
  });

  describe("board layout", () => {
    it("should render the title and view toggle outside the columns scroll area", async () => {
      // Acceptance: KB01-US6.2
      // Given the board is rendered with columns loaded
      renderBoardShell();
      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // Then the title and view toggle should not be inside the scroll container
      const header = screen.getByTestId("board-header");
      const scrollArea = screen.getByTestId("kanban-scroll-area");
      expect(header).toBeInTheDocument();
      expect(scrollArea).toBeInTheDocument();
      expect(header.contains(scrollArea)).toBe(false);
      expect(scrollArea.contains(header)).toBe(false);
    });

    it("should render columns inside a horizontally scrollable container", async () => {
      // Acceptance: KB01-US6.1
      // Given the board is rendered in kanban view
      renderBoardShell();
      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // Note: happy-dom has no layout engine; we verify the CSS class as a proxy for scroll behavior
      // Then columns should be inside a container with horizontal overflow scrolling
      const scrollArea = screen.getByTestId("kanban-scroll-area");
      expect(scrollArea.classList.contains("overflow-x-auto")).toBe(true);
    });

    it("should stretch the scroll area to fill remaining viewport height", async () => {
      // Acceptance: KB01-US6.4
      // Given the board is rendered with columns loaded
      renderBoardShell();
      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // Note: happy-dom has no layout engine; we verify the CSS class as a proxy for layout behavior
      // Then the scroll container should fill the remaining viewport height
      const scrollArea = screen.getByTestId("kanban-scroll-area");
      expect(scrollArea.classList.contains("flex-1")).toBe(true);
    });

    it("should add padding to prevent focus outlines from being clipped", async () => {
      // Acceptance: KB01-US6.3
      // Given the board is rendered with columns loaded
      renderBoardShell();
      await waitFor(() => {
        expect(screen.getByText("To Do")).toBeInTheDocument();
      });

      // Note: happy-dom has no layout engine; we verify the CSS class as a proxy for visual behavior
      // Then the scroll container should have padding so outlines on edge columns are not clipped
      const scrollArea = screen.getByTestId("kanban-scroll-area");
      expect(scrollArea.classList.contains("p-1")).toBe(true);
      expect(scrollArea.classList.contains("pb-4")).toBe(true);
    });
  });
});
