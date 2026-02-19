# Feature Specification: App Sidebar (SB01)

**Feature Code**: `SB01`

## User Stories

### User Story 1 - Sidebar Layout (Priority: P1)

Authenticated pages render with a sidebar layout following the shadcn sidebar-08 (inset) pattern. The sidebar appears alongside a header area (SidebarInset) containing a toggle trigger. Unauthenticated pages (home, login, signup) do not render the sidebar.

**Why this priority**: The sidebar is the primary navigation container. All other sidebar features (nav links, user menu) depend on the layout being in place.

**Independent Test**: Can be tested by rendering the board layout and verifying the sidebar structure (sidebar element, header with trigger) is present.

**Acceptance Scenarios**:

1. **US1.1** — **Given** the user is on any authenticated page, **When** the page renders, **Then** a sidebar and a header with a sidebar trigger are displayed.

---

### User Story 2 - Navigation Links (Priority: P1)

The sidebar content area displays navigation links for Home and Board. Links use Next.js `Link` for client-side navigation.

**Why this priority**: Navigation links are the core purpose of the sidebar content area. Without them, the sidebar is an empty shell.

**Independent Test**: Can be tested by rendering the AppSidebar component and verifying the presence and href of navigation links.

**Acceptance Scenarios**:

1. **US2.1** — **Given** the sidebar is rendered, **When** the user views the navigation section, **Then** links for "Home" (href `/`) and "Board" (href `/board`) are displayed.

---

### User Story 3 - User Menu (Priority: P1)

The sidebar footer displays the authenticated user's name and email in a user menu. A dropdown provides a "Sign out" action that calls `signOut()` from `@/lib/auth-client` and navigates to `/login`. This story surfaces auth behavior defined in AU01-US5.1 (session display) and AU01-US5.2 (sign-out) through the sidebar UI.

**Why this priority**: The user menu replaces the navbar's session display and sign-out functionality. It is the only place users can sign out after the navbar is removed.

**Independent Test**: Can be tested by rendering the NavUser component with a mocked session, verifying user info display, clicking sign out, and asserting `signOut` was called and navigation to `/login` occurred.

**Acceptance Scenarios**:

1. **US3.1** — **Given** the user is authenticated, **When** the sidebar footer renders, **Then** the user's name, email, and avatar with initials are displayed. *(Surfaces AU01-US5.1)*
2. **US3.2** — **Given** the user clicks "Sign out" in the user menu dropdown, **When** the sign-out completes, **Then** `signOut()` from `@/lib/auth-client` is called and the user is navigated to `/login`. *(Surfaces AU01-US5.2)*

---

### Cross-Cutting Concerns

1. **CC1** — **Given** the sidebar is rendered, **When** the user presses `Ctrl+B` (or `Cmd+B` on Mac), **Then** the sidebar toggles between expanded and collapsed states. *(Provided by shadcn SidebarProvider — no custom implementation needed)*

## Key Entities

No new data entities. The sidebar is a UI-only feature that consumes the existing `Session` entity from AU01 via `useSession()`.

## Key Decisions

- **Sidebar scoped to authenticated layout**: The sidebar is added via `src/app/(authenticated)/layout.tsx` using a Next.js route group, keeping unauthenticated pages (home, login, signup) unaffected. All future authenticated pages automatically get the sidebar by adding routes inside `(authenticated)/`.
- **Auth decoupled from sidebar**: Sign-in/sign-out functionality belongs to `@/lib/auth-client` (AU01). The sidebar imports and calls these functions but does not define auth logic. Removing the sidebar does not break auth.
- **Sidebar-08 inset pattern**: Uses `SidebarProvider` + `Sidebar variant="inset"` + `SidebarInset` for a modern inset layout with rounded content area.
- **Minimal content**: Only Home and Board navigation links — no sub-menus, projects, or secondary nav. Follows YAGNI principle.
