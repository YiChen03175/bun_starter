---
name: review-staged
description: Review staged or all uncommitted changes for bugs, best practices, and CLAUDE.md compliance. Use when you want a code review before committing.
argument-hint: "[staged|all]"
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(bun run validate), Read, Grep, Glob, Task
---

Review uncommitted code changes for bugs, best practices, documentation consistency, and CLAUDE.md compliance.

## Scope

The user specifies the review scope via `$ARGUMENTS`:

- `staged` — review only staged changes (`git diff --cached`)
- `all` (default if no argument) — review staged + unstaged + untracked files

## Workflow

### Step 1: Gather context

1. Determine scope from `$ARGUMENTS` (default: `all`)
2. Run the appropriate git commands:
   - **staged**: `git diff --cached` and `git diff --cached --name-only`
   - **all**: `git diff` (unstaged), `git diff --cached` (staged), `git ls-files --others --exclude-standard` (untracked), and the combined name list
3. Read the full content of every changed/new file (not just the diff) — you need context for pre-existing issues
4. Read `CLAUDE.md` and `README.md` for project conventions
5. If there are no changes to review, report "No changes found" and stop

### Step 2: Parallel review (5 Sonnet agents)

Launch 5 parallel Sonnet agents via the Task tool. Provide each agent with:
- The full diff
- The full content of changed files
- The contents of CLAUDE.md and README.md
- The list of changed file paths

Each agent focuses on one dimension and returns a list of issues. For each issue, include:
- `file:line` reference
- Severity: **high** (bugs, security, data loss, broken functionality) or **medium** (convention violations, missing tests, best practice deviations)
- Whether it's **new** (introduced by this diff) or **pre-existing** (exists in modified file but not caused by this change)
- Brief reason it was flagged

**Agent 1 — CLAUDE.md / README.md compliance**
Check all changes against documented conventions, patterns, import rules, naming conventions, and stack decisions in CLAUDE.md and README.md. Flag any inconsistency between what the docs say and what the code does. Also flag if the docs themselves need updating due to the changes.

**Agent 2 — Bug scan**
Shallow scan of the diff for obvious bugs: type safety issues, unsafe casts, logic errors, race conditions, security risks (injection, XSS, CSRF, secrets exposure), missing error handling, resource leaks. Focus on high-impact bugs. Skip issues that a linter, typechecker, or compiler would catch — those are handled by `bun run validate`.

**Agent 3 — Testing quality**
Review any new or modified test files. Check that:
- Tests actually exercise the behavior (not just pass trivially)
- Both happy path and error cases are covered
- Mocking is appropriate (not bypassing the thing being tested)
- Test follows project conventions from CLAUDE.md (test location, helpers, fixtures)
- No unnecessary `biome-ignore` or lint suppression comments without justification
- If production code changed but no tests were added/updated, flag it

**Agent 4 — Stack best practices**
Based on the technologies touched in the diff, check framework-specific best practices:
- React: hooks rules, proper error boundaries, key props, effect cleanup
- React Query / TanStack Query: correct cache invalidation, proper query key usage, staleTime/gcTime settings
- Eden treaty: proper error checking on `{ data, error }` responses, correct use of useEden vs useEdenClient
- Next.js: server/client component boundary, proper use of "use client", metadata, dynamic imports
- Elysia: plugin naming, proper status codes, error registration, auth macro usage
- Drizzle: proper schema types, migration workflow
- General: no hardcoded secrets, proper env var usage, dependency placement (dependencies vs devDependencies)

**Agent 5 — Documentation consistency**
Check whether the changes introduce new patterns, dependencies, conventions, or structural changes that require documentation updates:
- New dependencies in package.json should be reflected in README.md Stack section
- New file patterns or directories should be reflected in Project Structure sections
- New conventions should be documented in CLAUDE.md
- Inline code comments should be accurate and not stale
- README.md and CLAUDE.md should be consistent with each other

### Step 3: Report

Collect all issues from the 5 agents, deduplicate, and output:

---

## Code Review: [staged|all] changes

### Validate Results
[Report `bun run validate` output. If all passed: "All checks passed (lint, type-check, tests)."]

### Issues in Changed Code
[List new issues introduced by the diff. For each:]
1. **[high|medium]** `file:line` — Description (reason: CLAUDE.md says "...", or: bug due to ..., or: missing test for ...)

[If none: "No new issues found."]

### Pre-existing Issues
[List pre-existing issues in modified files, not caused by this change. For each:]
1. **[high|medium]** `file:line` — Description (pre-existing)

[If none: "No pre-existing issues found."]

### What Looks Good
[Brief bullet list of what was reviewed and found correct — e.g., "React Query setup follows documented patterns", "Cache invalidation uses typed query keys", "Tests cover happy path and error cases"]

---

## What to skip

These are NOT real issues — do not flag them:

- Issues that a linter, typechecker, or compiler would catch (handled by `bun run validate`)
- Pedantic nitpicks that a senior engineer wouldn't call out
- General code quality concerns (lack of coverage, vague security worries) unless explicitly required in CLAUDE.md
- Issues silenced by explicit lint-ignore comments that include a justification
- Intentional functionality changes clearly related to the broader change
- Formatting or style issues (handled by Biome)

## Review principles

1. **Review what changed, flag what exists** — new issues are primary; pre-existing issues are listed separately for the user to decide
2. **Bugs over style** — prioritize correctness, security, and data integrity over formatting
3. **Trust the toolchain** — don't duplicate linters, type checkers, and CI
4. **Check docs match code** — new patterns, deps, or conventions need doc updates
5. **Verify tests are real** — tests must exercise actual behavior, not just pass
6. **Stack-aware review** — apply framework-specific best practices for the technologies in the diff
7. **Cite everything** — every issue must reference file:line and the reason it was flagged
