/**
 * Markdown spec fixtures for parser and service tests.
 * Each fixture follows the spec template format from specs/.templates/spec.template.md.
 */

/** Simple spec with one user story, CCs, entities, and decisions (TF01) */
export const sampleSpecMarkdown = `# Feature Specification: Test Feature (TF01)

**Feature Code**: \`TF01\`

## User Stories

### User Story 1 - Do Something (Priority: P1)

Users can do something useful.

**Why this priority**: It is important.

**Independent Test**: Test by doing the thing.

**Acceptance Scenarios**:

1. **US1.1** — **Given** a state, **When** an action, **Then** an outcome.
2. **US1.2** [edge] — **Given** an edge case, **When** triggered, **Then** handled gracefully.

---

### Cross-Cutting Concerns

1. **CC1** [edge] — **Given** a cross-cutting state, **When** something happens, **Then** it is handled.

## Key Entities

- **Widget**: A thing that uses \`JSON\` format. Has a name and a size.
- **Gadget**: Another thing. Relates to Widget.

## Key Decisions

- **Use X over Y**: X is simpler and sufficient for our needs.
- **Cache results**: Avoids redundant parsing of static files.
`;

/** Simple spec used as "old" version in diff tests — one user story, one entity, one decision (TF01) */
export const oldSpecMarkdown = `# Feature Specification: Test (TF01)

**Feature Code**: \`TF01\`

## User Stories

### User Story 1 - Original (Priority: P1)

Original story.

**Why this priority**: Important.

**Independent Test**: Test it.

**Acceptance Scenarios**:

1. **US1.1** — **Given** X, **When** Y, **Then** Z.

## Key Entities

- **Widget**: A thing.

## Key Decisions

- **Use X**: Simpler.
`;

/** Extended version of oldSpecMarkdown with US2 added — used for diff detection */
export const newSpecMarkdown = `# Feature Specification: Test (TF01)

**Feature Code**: \`TF01\`

## User Stories

### User Story 1 - Original (Priority: P1)

Original story.

**Why this priority**: Important.

**Independent Test**: Test it.

**Acceptance Scenarios**:

1. **US1.1** — **Given** X, **When** Y, **Then** Z.

---

### User Story 2 - New Story (Priority: P2)

New story content.

**Why this priority**: Needed.

**Independent Test**: Test new.

**Acceptance Scenarios**:

1. **US2.1** — **Given** A, **When** B, **Then** C.

## Key Entities

- **Widget**: A thing.

## Key Decisions

- **Use X**: Simpler.
`;

/** Full-featured spec with multiple user stories, CCs, entities, and decisions (FL01) */
export const fullOldSpecMarkdown = `# Feature Specification: Full (FL01)

**Feature Code**: \`FL01\`

## User Stories

### User Story 1 - View Items (Priority: P1)

View all items.

**Why this priority**: Core feature.

**Independent Test**: Open the page.

**Acceptance Scenarios**:

1. **US1.1** — **Given** items exist, **When** page loads, **Then** items shown.

---

### User Story 2 - Delete Item (Priority: P3)

Delete an item.

**Why this priority**: Cleanup.

**Independent Test**: Click delete.

**Acceptance Scenarios**:

1. **US2.1** — **Given** item exists, **When** deleted, **Then** removed.

---

### Cross-Cutting Concerns

1. **CC1** — **Given** any action, **When** performed, **Then** auth required.
2. **CC2** — **Given** error, **When** thrown, **Then** logged.

## Key Entities

- **Item**: A manageable item.
- **Category**: Groups items together.

## Key Decisions

- **Use REST**: Simpler than GraphQL.
- **Use Postgres**: Reliable storage.
`;

/** Modified version of fullOldSpecMarkdown: US1 changed, US2 removed, US3 added,
 *  CC1 changed, CC2 removed, CC3 added, Item changed, Category removed, Tag added,
 *  Use REST changed, Use Postgres removed, Use Redis added */
export const fullNewSpecMarkdown = `# Feature Specification: Full (FL01)

**Feature Code**: \`FL01\`

## User Stories

### User Story 1 - View Items (Priority: P1)

View all items with filtering.

**Why this priority**: Core feature.

**Independent Test**: Open the page.

**Acceptance Scenarios**:

1. **US1.1** — **Given** items exist, **When** page loads, **Then** items shown.

---

### User Story 3 - Edit Item (Priority: P2)

Edit an existing item.

**Why this priority**: Needed.

**Independent Test**: Click edit.

**Acceptance Scenarios**:

1. **US3.1** — **Given** item exists, **When** edited, **Then** updated.

---

### Cross-Cutting Concerns

1. **CC1** — **Given** any action, **When** performed, **Then** auth and rate-limit required.
2. **CC3** — **Given** data change, **When** saved, **Then** audit logged.

## Key Entities

- **Item**: A manageable item with status.
- **Tag**: Labels for items.

## Key Decisions

- **Use REST**: Simpler and well-understood.
- **Use Redis**: Fast caching layer.
`;
