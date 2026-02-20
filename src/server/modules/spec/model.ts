import type { Static, TSchema } from "@sinclair/typebox";
import { Elysia, t } from "elysia";

// ---------------------------------------------------------------------------
// Base entity schemas
// ---------------------------------------------------------------------------

export const AcceptanceScenarioSchema = t.Object({
  id: t.String(),
  text: t.String(),
  edge: t.Boolean(),
});

export const UserStorySchema = t.Object({
  number: t.Number(),
  title: t.String(),
  priority: t.String(),
  description: t.String(),
  whyPriority: t.String(),
  independentTest: t.String(),
  acceptanceScenarios: t.Array(AcceptanceScenarioSchema),
});

export const KeyEntitySchema = t.Object({
  name: t.String(),
  description: t.String(),
});

export const KeyDecisionSchema = t.Object({
  choice: t.String(),
  reasoning: t.String(),
});

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const ParsedSpecSchema = t.Object({
  featureCode: t.String(),
  title: t.String(),
  userStories: t.Array(UserStorySchema),
  crossCuttingConcerns: t.Array(AcceptanceScenarioSchema),
  keyEntities: t.Array(KeyEntitySchema),
  keyDecisions: t.Array(KeyDecisionSchema),
});

export const SpecSummarySchema = t.Object({
  code: t.String(),
  title: t.String(),
});

// ---------------------------------------------------------------------------
// Diff schemas (dev-only)
// ---------------------------------------------------------------------------

function diffItemSchema<T extends TSchema>(itemSchema: T) {
  return t.Object({
    status: t.Union([
      t.Literal("added"),
      t.Literal("removed"),
      t.Literal("changed"),
    ]),
    old: t.Optional(itemSchema),
    new: t.Optional(itemSchema),
  });
}

export const SpecStructuredDiffSchema = t.Object({
  userStories: t.Array(diffItemSchema(UserStorySchema)),
  crossCuttingConcerns: t.Array(diffItemSchema(AcceptanceScenarioSchema)),
  keyEntities: t.Array(diffItemSchema(KeyEntitySchema)),
  keyDecisions: t.Array(diffItemSchema(KeyDecisionSchema)),
});

export const SpecChangeSchema = t.Object({
  code: t.String(),
  status: t.Union([
    t.Literal("new"),
    t.Literal("modified"),
    t.Literal("deleted"),
  ]),
  diff: t.Nullable(SpecStructuredDiffSchema),
  title: t.Optional(t.String()),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

export type AcceptanceScenario = Static<typeof AcceptanceScenarioSchema>;
export type UserStory = Static<typeof UserStorySchema>;
export type KeyEntity = Static<typeof KeyEntitySchema>;
export type KeyDecision = Static<typeof KeyDecisionSchema>;
export type ParsedSpec = Static<typeof ParsedSpecSchema>;
export type SpecSummary = Static<typeof SpecSummarySchema>;
export type SpecStructuredDiff = Static<typeof SpecStructuredDiffSchema>;
export type SpecChange = Static<typeof SpecChangeSchema>;

// Manual type — TypeBox's generic function return type cannot be statically inferred via Static<typeof>
export type DiffItem<T> = {
  status: "added" | "removed" | "changed";
  old?: T;
  new?: T;
};

// ---------------------------------------------------------------------------
// Elysia model plugin
// ---------------------------------------------------------------------------

export const SpecModel = new Elysia({ name: "Spec.Model" }).model({
  "spec.code": t.Object({
    code: t.String({ pattern: "^[A-Za-z0-9_-]+$" }),
  }),
});
