# Feature Specification: Kanban Board (KB01)

**Feature Code**: `KB01`

## User Stories

### User Story 1 - View and Manage Columns (Priority: P1)

An authenticated user visits the board page and sees their columns displayed in a horizontal kanban layout. First-time users automatically receive three default columns ("To Do", "In Progress", "Completed") so the board is immediately usable. The user can create new columns, rename existing columns inline, and delete columns they no longer need.

**Why this priority**: Columns are the structural foundation of the board. Without columns, tasks have no home. This is the minimal viable unit of the kanban experience.

**Independent Test**: Can be fully tested by logging in, visiting /board, verifying default columns appear, then creating, renaming, and deleting a column.

**Acceptance Scenarios**:

1. **US1.1** — **Given** a new user with no columns, **When** the user visits the board, **Then** three default columns ("To Do", "In Progress", "Completed") are automatically created and displayed.
2. **US1.2** — **Given** an existing user with columns, **When** the user visits the board, **Then** their existing columns are displayed in position order.
3. **US1.3** — **Given** the board is displayed, **When** the user types a column name and submits the create form, **Then** a new column appears at the end of the board.
4. **US1.4** — **Given** a column exists, **When** the user clicks the column title, edits it, and presses Enter or clicks away, **Then** the column title is updated.
5. **US1.5** — **Given** a column exists, **When** the user clicks the delete button on a column, **Then** the column and all its tasks are removed.
6. **US1.6** [edge] — **Given** the create form, **When** the user submits an empty or whitespace-only title, **Then** no column is created and the form remains available.
7. **US1.7** [edge] — **Given** a rename blur event fires because the user clicked the delete button, **When** both events trigger, **Then** the rename is skipped to prevent a race condition with the delete action.

---

### User Story 2 - Create and Delete Tasks (Priority: P2)

An authenticated user creates tasks within a specific column using an inline form at the bottom of each column. Each task has a required title and an optional description. Tasks are displayed as cards within their column. Users can delete tasks they no longer need via a dropdown menu on the task card.

**Why this priority**: Tasks are the core work items that users interact with daily. Creating and removing tasks is the fundamental board interaction after columns exist.

**Independent Test**: Can be fully tested by adding a task to a column, verifying it appears as a card, then deleting it and verifying it disappears.

**Acceptance Scenarios**:

1. **US2.1** — **Given** a column exists, **When** the user types a task title and submits the task form, **Then** a new task card appears in that column.
2. **US2.2** — **Given** a task with a description exists, **When** the card is displayed, **Then** both the title and description are visible.
3. **US2.3** — **Given** a task exists, **When** the user opens the task dropdown menu and clicks "Delete", **Then** the task is removed from the board.
4. **US2.4** [edge] — **Given** the task form, **When** the user submits an empty or whitespace-only title, **Then** no task is created.
5. **US2.5** — **Given** a column has more than 10 tasks, **When** the user views the column, **Then** pagination controls appear and the user can navigate between pages.

---

### User Story 3 - Move Tasks Between Columns (Priority: P3)

An authenticated user moves a task from one column to another to reflect progress. The task card's dropdown menu shows "Move to [Column Name]" options for every column except the task's current column.

**Why this priority**: Moving tasks between columns is the core kanban workflow, but it depends on both columns and tasks existing first.

**Independent Test**: Can be fully tested by creating a task in "To Do", using the dropdown to move it to "In Progress", and verifying it appears in the new column.

**Acceptance Scenarios**:

1. **US3.1** — **Given** a task exists in column A and columns A, B, and C exist, **When** the user opens the task dropdown, **Then** "Move to B" and "Move to C" are shown but "Move to A" is not.
2. **US3.2** — **Given** a task in column A, **When** the user selects "Move to B" from the dropdown, **Then** the task moves to column B and is no longer in column A.

---

### User Story 4 - Table View (Priority: P4)

An authenticated user switches from the default kanban view to a table view that displays all tasks across all columns in a flat, paginated table. Each row shows the task title, its parent column name (as a badge), description, and a delete action. The user can switch back to the kanban view at any time.

**Why this priority**: The table view provides an alternative perspective for users who prefer scanning all tasks at once, but it is secondary to the core kanban workflow.

**Independent Test**: Can be fully tested by clicking "Table" toggle, verifying all tasks appear in a flat list with column badges, paginating through results, and switching back to "Board" view.

**Acceptance Scenarios**:

1. **US4.1** — **Given** the user is on the kanban view, **When** the user clicks the "Table" toggle, **Then** all tasks are displayed in a table sorted by most recently updated.
2. **US4.2** — **Given** the table view is active, **When** more than 20 tasks exist, **Then** pagination shows "Showing X-Y of Z" with navigation controls.
3. **US4.3** — **Given** the table view is active, **When** the user clicks "Delete" on a row, **Then** the task is removed.
4. **US4.4** — **Given** the table view is active, **When** the user clicks the "Board" toggle, **Then** the kanban column view is restored.

---

### User Story 5 - Data Isolation (Priority: P1)

Each user's columns and tasks are private — no user can see, modify, or delete another user's data. All service-layer operations are scoped by userId.

> **Note**: Authentication and route protection are specified in [AU01-auth](../AU01-auth/spec.md). This story focuses exclusively on data isolation within the board module.

**Why this priority**: Data isolation is non-negotiable in a multi-user context. Without userId scoping, one user could access another's data.

**Independent Test**: Can be fully tested by logging in as user B and verifying only user B's data is visible (or default columns if first visit), and that operations only affect user B's data.

**Acceptance Scenarios**:

1. **US5.1** — **Given** user A has columns and tasks, **When** user B logs in and visits /board, **Then** user B sees only their own data (or default columns if first visit).
2. **US5.2** — **Given** an authenticated user, **When** they perform any board operation (create, update, delete), **Then** the operation only affects their own data.

---

### User Story 6 - Board Layout (Priority: P1)

The board page presents the main content area beside the sidebar. The page title
and view toggle remain fixed at the top while the kanban columns scroll horizontally
beneath them. Only the columns area scrolls — the surrounding layout stays stable.

**Why this priority**: Layout issues directly impact usability — double scrollbars
confuse users, drifting controls are unreachable, and clipped outlines hide focus state.

**Independent Test**: Can be tested by rendering the board and verifying the title bar
is structurally outside the scrollable columns container.

**Acceptance Scenarios**:

1. **US6.1** — **Given** the board has more columns than fit in the viewport, **When** the user scrolls horizontally, **Then** only the columns area scrolls (no outer page scroll).
2. **US6.2** — **Given** the board has more columns than fit in the viewport, **When** the user scrolls the columns area, **Then** the page title and view toggle remain fixed at the top.
3. **US6.3** — **Given** focus or selection outlines are visible on edge columns, **When** the board renders, **Then** the outlines are not clipped by the scroll container.
4. **US6.4** — **Given** the board columns have minimal content (empty or few tasks), **When** the user hovers anywhere below the columns within the content area, **Then** horizontal scrolling still works because the scroll container fills the remaining viewport height.

---

### Cross-Cutting Concerns

1. **CC1** [edge] — **Given** a form submission is in progress, **When** the user clicks submit again, **Then** the submit button is disabled to prevent duplicate submissions.
2. **CC2** [edge] — **Given** the API returns an error during a mutation, **When** the error is displayed, **Then** the form retains the user's input so they can retry without retyping.
3. **CC3** [edge] — **Given** column or task data fails to load, **When** the board renders, **Then** an error state is displayed to the user.

## Key Entities

- **Column**: A stage in a workflow (e.g., "To Do", "In Progress"). Has a title and a position for ordering. Belongs to a single user. Contains zero or more tasks. Deleting a column cascade-deletes all its tasks.
- **Task**: A unit of work. Has a title, an optional description, and a position within its column. Belongs to both a column and a user. Can be moved between columns owned by the same user.

## Key Decisions

- **Dropdown move instead of drag-and-drop**: Simpler implementation, better accessibility, avoids complex DnD library dependency. Move is a 2-click action (open dropdown + select target).
- **Cascade-delete columns with tasks**: No orphaned tasks, simpler mental model. Users expect deleting a container removes its contents.
- **Default columns on first visit**: Eliminates empty-board onboarding friction. Users see a functional board immediately without setup steps.
- **Inline rename (Enter/blur to save)**: Matches common UI patterns (Trello, Notion). No modal or separate edit form needed.
- **Separate kanban and table views via toggle**: Each view serves a different use case (spatial workflow vs. flat scanning). Toggle preserves data — views are presentation-only.
- **Skip rename on blur when delete is clicked**: Prevents a race condition where blur fires a rename request just before the delete request, potentially resurrecting a deleted column's title.
