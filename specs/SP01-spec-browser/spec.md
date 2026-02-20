# Feature Specification: Spec Browser (SP01)

**Feature Code**: `SP01`

## User Stories

### User Story 1 - Browse Specs via API (Priority: P1)

A developer or stakeholder accesses the spec API to retrieve structured JSON representations of feature specifications. The API lists all available specs and returns parsed detail for each one. Specs are parsed from the markdown template format into structured JSON with user stories, acceptance scenarios, entities, and decisions.

**Why this priority**: The API is the data layer that both the frontend and any external tooling depend on. Without it, nothing can consume spec data programmatically.

**Independent Test**: Can be tested by calling GET /api/specs to list specs and GET /api/specs/:code to retrieve a parsed spec, verifying the JSON structure matches the markdown source.

**Acceptance Scenarios**:

1. **US1.1** — **Given** spec files exist in the specs/ directory, **When** a GET request is made to /api/specs, **Then** a JSON array of spec summaries (code, title) is returned sorted by code.
2. **US1.2** — **Given** a spec file exists for a given code, **When** a GET request is made to /api/specs/:code, **Then** the full parsed spec is returned with featureCode, title, userStories, crossCuttingConcerns, keyEntities, and keyDecisions.
3. **US1.3** — **Given** a spec code that does not exist, **When** a GET request is made to /api/specs/:code, **Then** a 404 response is returned.
4. **US1.4** — **Given** a markdown spec with user stories, **When** the parser processes it, **Then** each user story has number, title, priority, description, whyPriority, independentTest, and acceptanceScenarios extracted.
5. **US1.5** [edge] — **Given** a spec with [edge] tagged scenarios, **When** parsed, **Then** those scenarios have edge: true in the output.

---

### User Story 2 - Visual Spec Browser Page (Priority: P2)

A developer visits /specs and sees a browsable interface listing all feature specs in a sidebar. Clicking a spec shows its full parsed content with user stories, acceptance scenarios, entities, and decisions in a structured layout.

**Why this priority**: The page provides the visual interface that makes specs accessible to non-technical stakeholders, but depends on the API from US1.

**Independent Test**: Can be tested by navigating to /specs, verifying the spec list renders, clicking a spec, and verifying the detail view shows structured content.

**Acceptance Scenarios**:

1. **US2.1** — **Given** specs exist, **When** the user visits /specs, **Then** a list of all specs is displayed with titles and feature codes.
2. **US2.2** — **Given** the spec list is displayed, **When** the user clicks a spec, **Then** the detail panel shows the parsed spec content with user stories, entities, and decisions.
3. **US2.3** — **Given** a spec has key entities or key decisions, **When** the detail panel renders, **Then** each entity/decision displays the name/choice as a title line with the description/reasoning on a separate line below.

---

### User Story 3 - Dev Spec Diff Tool (Priority: P3)

During development, a developer visits /specs and sees which spec files have uncommitted changes. Modified specs are sorted to the top with visual indicators, and a structured diff panel shows what changed compared to the last commit. This feature is dev-only and does not appear in production.

**Why this priority**: A convenience tool that depends on the existing spec browser (US1 + US2). No production impact.

**Independent Test**: Can be tested by modifying a spec file without committing, visiting /specs in dev mode, and verifying the changed spec appears at the top with a diff panel.

**Acceptance Scenarios**:

1. **US3.1** — **Given** the app is running in production, **When** the dev changes endpoint is called, **Then** it returns a 404 response indicating the feature is unavailable.
2. **US3.2** — **Given** a spec file has been modified but not committed, **When** the developer visits /specs in dev mode, **Then** the spec appears with a "modified" indicator and a structured diff is available.
3. **US3.3** — **Given** a new spec file exists that is untracked by git, **When** the developer visits /specs in dev mode, **Then** the spec appears with a "new" badge.
4. **US3.4** — **Given** specs have uncommitted changes, **When** the spec list renders, **Then** changed specs are sorted to the top of the sidebar.
5. **US3.5** — **Given** a modified spec is selected, **When** the detail panel renders, **Then** diff indicators appear inline within each section (user stories, acceptance scenarios, entities, decisions) showing add/remove/change status.
6. **US3.6** — **Given** the app is running in production, **When** the /specs page loads, **Then** no dev change indicators or diff panels are shown.
7. **US3.7** — **Given** the spec list exceeds the viewport height, **When** the developer scrolls, **Then** the sidebar and detail panel scroll independently.
8. **US3.8** — **Given** specs have uncommitted changes, **When** the sidebar renders, **Then** modified specs show a small yellow dot, new specs show a small green dot, and deleted specs show a strikethrough name.
9. **US3.9** — **Given** a spec folder has been deleted from disk but exists in the last commit, **When** the developer visits /specs in dev mode, **Then** the deleted spec appears in the sidebar with a strikethrough name, and clicking it shows the last committed content without diff overlay.

---

### Cross-Cutting Concerns

1. **CC1** — **Given** specs are static files, **When** the same spec is requested multiple times, **Then** parsed results are served from an in-memory cache (cache is bypassed in development mode to allow live spec editing).

## Key Entities

- **ParsedSpec**: A structured JSON representation of a feature spec. Contains featureCode, title, userStories, crossCuttingConcerns, keyEntities, and keyDecisions.
- **SpecSummary**: A lightweight summary of a spec containing just code and title, used for listing.
- **SpecChange**: A dev-only change entry containing the spec code, status (new/modified/deleted), an optional structured diff, and an optional title (for deleted specs not present in the specs list).
- **SpecStructuredDiff**: A structured comparison of two parsed specs, showing added/removed/changed items per section (user stories, cross-cutting concerns, entities, decisions).

## Key Decisions

- **mdast-util-from-markdown over remark/unified**: Minimal dependency — parses markdown to AST directly without a plugin pipeline. Same underlying engine as remark but no framework overhead.
- **In-memory cache**: Specs are static files that don't change at runtime. A simple Map cache avoids re-parsing on every request.
- **Public endpoint (no auth)**: Specs are project documentation, similar to Swagger docs. No authentication required.
- **Custom AST walker over regex**: The markdown follows a known template, but an AST walker is more robust than regex for extracting nested structures (headings, lists, bold text).
- **simple-git (dev dependency) with dynamic import**: Keeps git operations out of the production bundle. Dynamic `import("simple-git")` ensures the module is only loaded in development.
