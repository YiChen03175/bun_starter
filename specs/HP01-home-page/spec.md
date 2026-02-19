# Feature Specification: Home Page (HP01)

**Feature Code**: `HP01`

## User Stories

### User Story 1 - Home Page Landing (Priority: P1)

A user visits the home page and sees a single call-to-action button to open the Kanban Board. Clicking it navigates to `/board`. Authentication is handled by the proxy middleware (AU01-US4.2): unauthenticated users are redirected to `/login`, authenticated users see the board with sidebar.

**Why this priority**: The home page is the entry point to the application. A single clear action reduces friction.

**Independent Test**: Can be tested by rendering the home page and verifying the button presence, href, and absence of other navigation elements.

**Acceptance Scenarios**:

1. **US1.1** — **Given** the home page is visited, **When** it renders, **Then** a single "Open Kanban Board" button linking to `/board` is displayed.
2. **US1.2** — **Given** an unauthenticated user clicks "Open Kanban Board", **When** navigation to `/board` occurs, **Then** the proxy redirects them to `/login`. *(Surfaces AU01-US4.2 — no home page code needed, proxy handles it)*

## Key Entities

No data entities. The home page is a static server component with no data fetching.

## Key Decisions

- **Single button, no auth UI on home page**: The home page delegates auth concerns entirely to the proxy middleware. No sign-in/sign-out buttons — the sidebar handles session UI for authenticated pages.
- **Server component**: The home page has no interactivity and renders as a server component (no `"use client"`).
