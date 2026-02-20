---
name: review-staged
description: Review staged or all uncommitted changes for bugs, correctness, spec-code-test triad compliance, and CLAUDE.md adherence. Use before committing.
argument-hint: "[staged|all]"
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(bun run validate), Read, Grep, Glob, Task
---

Review uncommitted code changes for bugs, correctness, spec-code-test triad compliance, and CLAUDE.md adherence.

## Severity Levels

| Level | Meaning | Examples |
|-------|---------|---------|
| **P1** | Must fix before merge — blocks shipping | Data loss or corruption bugs; security vulnerabilities (XSS, injection, secrets exposure); broken auth; missing `await` on `.rejects` assertions; spec-code-test triad violations (undocumented behavior, unverified scenarios, orphaned acceptance IDs); schema change with no migration file; interactive code in a server component; unregistered custom Elysia error |
| **P2** | Should fix, but may ship as a tracked follow-up | Missing edge-case test coverage; wrong HTTP status codes; cache invalidation gaps; CLAUDE.md convention violations; acceptance comment referencing wrong-but-real ID; stale CLAUDE.md/README.md after a structural change; resource leaks; deprecated React 19 event types; inline object types for DB/API data instead of schema-derived types (Principle I) |
| **P3** | Suggestion or nit — take it or leave it | Naming that could be clearer; a simpler expression of the same logic; imprecise inline comment; BDD comment describing mock internals instead of product behavior |

## Scope

The user specifies the review scope via `$ARGUMENTS`:

- `staged` — review only staged changes (`git diff --cached`)
- `all` (default if no argument) — staged + unstaged + untracked files

## Workflow

### Step 1: Gather context

1. Determine scope from `$ARGUMENTS` (default: `all`)
2. Run the appropriate git commands:
   - **staged**: `git diff --cached` and `git diff --cached --name-only`
   - **all**: `git diff` (unstaged), `git diff --cached` (staged), `git ls-files --others --exclude-standard` (untracked), and the combined name list
3. Read the full content of every changed/new file (not just the diff) — full context is needed to assess pre-existing issues and spec cross-references
4. Read all spec files under `specs/` — needed by Agent 5 for triad verification
5. If there are no changes to review, report "No changes found" and stop

### Step 2: Parallel review (5 Sonnet agents)

Launch 5 parallel Sonnet agents via the Task tool. Provide each agent with:
- The full diff
- The full content of changed files
- The contents of CLAUDE.md and README.md
- The list of changed file paths
- **Agent 5 only**: the full contents of all spec files under `specs/`

Each agent focuses on one dimension and returns a list of issues. For each issue, include:
- `file:line` reference (use `spec:<XX##>-<ID>` for spec-side triad issues)
- Severity: **P1**, **P2**, or **P3** per the table above
- Whether it is **new** (introduced by this diff) or **pre-existing** (in a modified file but not caused by this change)
- The concrete reason it was flagged — cite the specific rule, spec ID, or CLAUDE.md section

**Agent 1 — CLAUDE.md / README.md compliance**
Check all changes against documented conventions, patterns, import rules, naming conventions, and stack decisions in CLAUDE.md and README.md.

Flag:
- Code violating an explicit CLAUDE.md rule (e.g., relative imports instead of `@/*` aliases, `process.env` used directly in application code, `asChild` instead of `render` prop on Shadcn components) → **P1** if runtime-breaking, **P2** if convention-only
- Component prop interface using inline object type `{ id: number; title: string; ... }` for data that originates from the database or API, instead of deriving from `SelectX`/`Pick<SelectX, ...>` (schema types) or `Static<typeof Schema>` (Elysia.t types) → **P2** (CLAUDE.md Principle I: Type Safety End-to-End)
- Service method parameter using inline type annotation instead of importing the derived type from `./model` → **P2** (CLAUDE.md Principle I)
- Elysia.t model file defining schemas inline in `.model()` without exporting named schema constants and `Static<typeof>` derived types → **P2** (CLAUDE.md Principle I)
- Test fixture or mock data object representing a DB entity without a type annotation from `@/server/db/schema` (e.g., `SelectColumn`, `SelectTask`) → **P3**
- CLAUDE.md or README.md now stale due to structural or convention changes in this diff (new folder, new command, new pattern) → **P2**
- Inaccurate inline comments given the change → **P3**

**Agent 2 — Bug scan**
Shallow scan of the diff for concrete, demonstrable bugs that survive `bun run validate`.

Flag:
- Data loss, corruption, or silent failures → **P1**
- Security vulnerabilities: injection, XSS, CSRF, hardcoded secrets, unguarded auth paths → **P1**
- Logic errors: off-by-one, wrong comparison operator, unreachable error handler, missing `await` on async calls → **P1**
- Resource leaks: event listeners or subscriptions added but never cleaned up → **P2**
- Broad error swallowing (`catch(() => {})`) with no logging or re-throw → **P2**

Skip anything `tsc --noEmit` or Biome would catch.

**Agent 3 — Testing quality**
Review new and modified test files for correctness and convention compliance.

Flag:
- Production code with new observable behavior and no corresponding new or updated test → **P1**
- Test that mocks the module under test → **P1**
- Missing `await` on `.rejects` assertions (silent false positive per CLAUDE.md) → **P1**
- Test that passes trivially: asserts a mock was called (`toHaveBeenCalled()`) on a write operation without asserting the payload (`toHaveBeenCalledWith(...)`) → **P2**
- Missing error-path test for a new error branch in production code → **P2**
- `biome-ignore` or `// @ts-ignore` in test code without justification comment → **P2**
- `document.createElement` used for event targets instead of rendered elements (CLAUDE.md testing pitfall) → **P2**
- BDD `// Given/When/Then` comments describing mock internals rather than product behavior (CLAUDE.md BDD guidelines) → **P3**

Scope: test mechanics and coverage only — acceptance comment traceability is out of scope for this agent.

**Agent 4 — Stack best practices**
For each framework or library touched in the diff, apply idiomatic best practices.

React:
- Hook rules violation (conditional hook, hook inside loop) → **P1**
- Missing `key` prop on list elements → **P2**
- Missing cleanup return in `useEffect` (listeners, subscriptions, timers) → **P2**

Next.js:
- Interactive code (event handlers, hooks) in a server component without `"use client"` → **P1**
- `"use client"` added to a component with no interactivity → **P2**

React Query / TanStack Query:
- Missing cache invalidation after a mutation that changes server state → **P2**

Eden treaty:
- Response used without checking the `error` field → **P2**

Elysia (ref: elysiajs.com/essential/best-practice):
- Entire Elysia Context object passed to a function instead of destructuring needed values → **P2**
- Service function depends on Elysia request context (couples business logic to HTTP) → **P2**
- Plugin missing `{ name: "..." }` option (breaks deduplication) → **P2**
- Custom error class used but not registered via `.error()` → **P1**
- Route that should be protected missing `{ auth: true }` → **P1**

Drizzle:
- Schema change with no corresponding migration file → **P1**

**Agent 5 — Spec-code-test triad verification**
Verify that the spec-code-test triad (CLAUDE.md Principle II) remains in sync across the diff. Every behavioral change must flow through: spec defines it → code implements it → tests verify it. A break at any edge is a defect.

You have been given the full contents of all spec files under `specs/`. Use the feature code in each spec header (e.g., `Feature Code: KB01`) to map folders to feature codes.

**A. New or changed production code → spec check**
For each changed non-test, non-infrastructure file (exclude `src/components/ui/`, config files, `src/env.ts`, `src/server/db/schema.ts`):
1. Identify the behavioral change introduced.
2. Search the spec corpus for an acceptance scenario covering this behavior.
3. Flag **P1** if: behavior is new and no spec scenario covers it — cite what the behavior is and why it needs a scenario.
4. Flag **P2** if: a scenario covers it but the wording has drifted from the implementation — the scenario is stale.
5. Do NOT flag: refactors with no behavioral change, infrastructure internals, or behavior covered by an existing accurate scenario.

**B. New or changed spec scenarios → test check**
For each new or modified acceptance scenario in any spec file in the diff:
1. Search `test/` (including unchanged files) for `// Acceptance: <feature-code>-<scenario-ID>`.
2. Flag **P1** if: new scenario has no test anywhere in `test/`.
3. Flag **P2** if: scenario wording changed and existing tests reference behavior that no longer matches the updated wording.
4. Do NOT flag: scenarios whose spec text explicitly exempts them from unit tests (e.g., "no unit tests needed", "covered implicitly").

**C. Acceptance comments in tests → spec resolution check**
For each `// Acceptance: <ID>` comment in any test file in the diff:
1. Parse the feature code and scenario ID (e.g., `KB01` and `US1.3`, or `SB01` and `CC1`).
2. Locate the matching spec file by scanning `specs/` for `Feature Code: <XX##>`.
3. Flag **P1** if: no spec file has that feature code (orphaned — spec deleted or ID mistyped).
4. Flag **P1** if: the feature code resolves but the scenario ID (US1.3, CC1, etc.) does not appear in that spec file.
5. Flag **P2** if: the ID resolves but the test's Given/When/Then comments clearly describe a different scenario than the spec wording (copy-paste ID error).
6. Do NOT flag: multiple tests referencing the same ID — this is intentional (service, controller, and component tests all verify the same scenario).

**D. Format compliance for new `it()` blocks**
For each new `it()` block in any test file in the diff:
1. Flag **P2** if: the test exercises a behavioral scenario defined in a spec but has no `// Acceptance:` comment as the first line of its body.
2. Flag **P3** if: the comment exists but uses non-standard format (lowercase, missing feature-code prefix, extra whitespace).
3. Do NOT flag: `it()` blocks testing loading spinners, skeleton states, error boundary fallbacks, utility helpers, or test infrastructure — these genuinely lack spec scenarios.

### Step 3: Run validation and produce report

Run `bun run validate`. Collect all agent results. Deduplicate (same `file:line` flagged by multiple agents = one issue at the higher severity). Then output:

---

## Code Review: [staged|all] changes

### Validation
[`bun run validate` output. If all passed: "All checks passed (lint, type-check, tests)." If failed, quote the relevant error lines.]

### P1 — Must Fix Before Merge
[Numbered list of all P1 issues. Each entry:]
1. `file:line` **[new|pre-existing]** — Description. Reason: [cite the rule, spec ID, or CLAUDE.md section]

[If none: "None."]

### P2 — Should Fix
[Numbered list of all P2 issues.]
1. `file:line` **[new|pre-existing]** — Description. Reason: [cite]

[If none: "None."]

### P3 — Suggestions
[Numbered list of all P3 issues. No new/pre-existing tag needed.]
1. `file:line` — Description.

[If none: "None."]

---

## What to skip

These are NOT issues — do not flag them:

- Anything `tsc --noEmit` or Biome would catch (handled by `bun run validate`)
- Formatting, import ordering, or style managed by Biome
- Lint-ignore comments that include a justification
- Refactors with no observable behavioral change (extract function, rename variable, reorganize imports)
- Speculative concerns: "this could be a problem if..." without evidence it applies here
- General code quality opinions not grounded in a specific CLAUDE.md rule or the severity table above
- Triad: loading spinners, skeleton states, error boundary fallbacks, utility/helper test isolation — these rarely have spec scenarios and should not be flagged for missing acceptance comments
- Triad: pre-existing test files where only an unrelated line was touched (imports reformatted, etc.)

## Review principles

1. **P1s before anything else** — a single P1 can block a merge; identify all P1s before spending effort on P2/P3
2. **Cite everything** — every issue must reference `file:line` and the specific rule it violates; vague concerns are not issues
3. **Bugs over convention** — a P1 bug always outranks a P2 convention violation; never inflate P2s to argue urgency
4. **Trust the toolchain** — do not re-flag what `bun run validate` already catches
5. **Triad is non-negotiable** — the spec-code-test triad is a core project invariant (CLAUDE.md Principle II); undocumented or unverified behavior is a P1 regardless of how small the change seems
6. **New issues first** — pre-existing issues are noted for completeness; authors are not expected to fix inherited debt in the same commit
7. **Surgical P3s** — P3s should be rare and genuinely useful; when uncertain between P2 and P3, default to P3
