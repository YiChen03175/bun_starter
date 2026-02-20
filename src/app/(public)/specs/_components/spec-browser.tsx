"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEden } from "@/lib/eden-query";
import { cn } from "@/lib/utils";
import type {
  AcceptanceScenario,
  DiffItem,
  KeyDecision,
  KeyEntity,
  ParsedSpec,
  SpecChange,
  SpecStructuredDiff,
  SpecSummary,
  UserStory,
} from "@/server/modules/spec/model";
import {
  AddedDecisionItem,
  AddedEntityItem,
  AddedScenarioItem,
  AddedStoryCard,
  ChangedDecisionItem,
  ChangedEntityItem,
  ChangedScenarioItem,
  ChangedStoryCard,
  RemovedDecisionItem,
  RemovedEntityItem,
  RemovedScenarioItem,
  RemovedStoryCard,
} from "./spec-diff";
import {
  DecisionItem,
  EntityItem,
  ScenarioItem,
  StoryCard,
} from "./spec-display";

// ---------------------------------------------------------------------------
// SpecBrowser — top-level layout with sidebar + detail
// ---------------------------------------------------------------------------

export function SpecBrowser({
  specs,
  devChanges = [],
}: {
  specs: SpecSummary[];
  devChanges?: SpecChange[];
}) {
  const eden = useEden();

  const changeMap = useMemo(() => {
    const map = new Map<string, SpecChange>();
    for (const change of devChanges) {
      map.set(change.code, change);
    }
    return map;
  }, [devChanges]);

  // Merge deleted specs (not in specs list) into the combined list
  const allSpecs = useMemo(() => {
    const deletedSpecs: SpecSummary[] = devChanges
      .filter(
        (c): c is SpecChange & { title: string } =>
          c.status === "deleted" && !!c.title,
      )
      .map((c) => ({ code: c.code, title: c.title }));
    return [...specs, ...deletedSpecs];
  }, [specs, devChanges]);

  const sortedSpecs = useMemo(() => {
    if (changeMap.size === 0) return allSpecs;
    return [...allSpecs].sort((a, b) => {
      const aChanged = changeMap.has(a.code) ? 0 : 1;
      const bChanged = changeMap.has(b.code) ? 0 : 1;
      if (aChanged !== bChanged) return aChanged - bChanged;
      return a.code.localeCompare(b.code);
    });
  }, [allSpecs, changeMap]);

  const [selectedCode, setSelectedCode] = useState<string>(
    sortedSpecs[0]?.code ?? "",
  );

  const { data: spec, isLoading: specLoading } = useQuery({
    ...eden.api.specs({ code: selectedCode }).get.queryOptions(),
    enabled: !!selectedCode,
  });

  const selectedChange = changeMap.get(selectedCode);

  return (
    <div className="grid h-full grid-cols-[240px_1fr] gap-6">
      {/* Sidebar */}
      <nav className="space-y-1 overflow-y-auto pr-4">
        {sortedSpecs.map((s) => {
          const change = changeMap.get(s.code);
          return (
            <button
              type="button"
              key={s.code}
              onClick={() => setSelectedCode(s.code)}
              className={cn(
                "relative w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                selectedCode === s.code
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {change?.status === "modified" && (
                <span
                  className="absolute top-1 left-1 h-1 w-1 rounded-full bg-yellow-500"
                  title="Uncommitted changes"
                />
              )}
              {change?.status === "new" && (
                <span
                  className="absolute top-1 left-1 h-1 w-1 rounded-full bg-green-500"
                  title="New spec"
                />
              )}
              <span
                className={cn(
                  "font-medium",
                  change?.status === "deleted" && "line-through",
                )}
              >
                {s.title}
              </span>
              <div
                className={cn(
                  "font-mono text-xs",
                  selectedCode === s.code
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground",
                )}
              >
                {s.code}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Detail */}
      <div className="min-w-0 overflow-y-auto">
        {specLoading && (
          <div className="fade-in animate-in space-y-6 fill-mode-backwards p-1 pr-4 delay-200 duration-150">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="mt-2 h-5 w-16" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        )}
        {!specLoading && spec && (
          <SpecDetail
            spec={spec}
            diff={
              selectedChange?.status === "deleted" ? null : selectedChange?.diff
            }
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpecDetail — orchestrates base + diff components
// ---------------------------------------------------------------------------

function SpecDetail({
  spec,
  diff,
}: {
  spec: ParsedSpec;
  diff?: SpecStructuredDiff | null;
}) {
  // Build diff lookup maps only when diff data is present (dev-only)
  const storyDiffMap = useMemo(() => {
    if (!diff) return null;
    const map = new Map<number, DiffItem<UserStory>>();
    for (const d of diff.userStories) {
      const story = d.new ?? d.old;
      if (story) map.set(story.number, d);
    }
    return map;
  }, [diff]);

  const ccDiffMap = useMemo(() => {
    if (!diff) return null;
    const map = new Map<string, DiffItem<AcceptanceScenario>>();
    for (const d of diff.crossCuttingConcerns) {
      const cc = d.new ?? d.old;
      if (cc) map.set(cc.id, d);
    }
    return map;
  }, [diff]);

  const entityDiffMap = useMemo(() => {
    if (!diff) return null;
    const map = new Map<string, DiffItem<KeyEntity>>();
    for (const d of diff.keyEntities) {
      const entity = d.new ?? d.old;
      if (entity) map.set(entity.name, d);
    }
    return map;
  }, [diff]);

  const decisionDiffMap = useMemo(() => {
    if (!diff) return null;
    const map = new Map<string, DiffItem<KeyDecision>>();
    for (const d of diff.keyDecisions) {
      const decision = d.new ?? d.old;
      if (decision) map.set(decision.choice, d);
    }
    return map;
  }, [diff]);

  // Only removed items need separate arrays (they don't exist in spec.*)
  const removedStories =
    diff?.userStories.filter((d) => d.status === "removed") ?? [];
  const removedCCs =
    diff?.crossCuttingConcerns.filter((d) => d.status === "removed") ?? [];
  const removedEntities =
    diff?.keyEntities.filter((d) => d.status === "removed") ?? [];
  const removedDecisions =
    diff?.keyDecisions.filter((d) => d.status === "removed") ?? [];

  return (
    <div className="space-y-6 p-1 pr-4">
      <div>
        <h2 className="font-bold text-2xl">{spec.title}</h2>
        <Badge variant="outline" className="mt-1 font-mono">
          {spec.featureCode}
        </Badge>
      </div>

      {/* User Stories */}
      {(spec.userStories.length > 0 || removedStories.length > 0) && (
        <section>
          <h3 className="mb-3 font-semibold text-lg">User Stories</h3>
          <div className="space-y-4">
            {removedStories.map(
              (d) =>
                d.old && <RemovedStoryCard key={d.old.number} story={d.old} />,
            )}
            {spec.userStories.map((story) => {
              const d = storyDiffMap?.get(story.number);
              if (d?.status === "added") {
                return <AddedStoryCard key={story.number} story={story} />;
              }
              if (d?.status === "changed" && d.old) {
                return (
                  <ChangedStoryCard
                    key={story.number}
                    story={story}
                    oldStory={d.old}
                  />
                );
              }
              return <StoryCard key={story.number} story={story} />;
            })}
          </div>
        </section>
      )}

      {/* Cross-Cutting Concerns */}
      {(spec.crossCuttingConcerns.length > 0 || removedCCs.length > 0) && (
        <section>
          <h3 className="mb-3 font-semibold text-lg">Cross-Cutting Concerns</h3>
          <Card size="sm">
            <CardContent>
              <ul className="space-y-1.5">
                {removedCCs.map(
                  (d) =>
                    d.old && (
                      <RemovedScenarioItem key={d.old.id} scenario={d.old} />
                    ),
                )}
                {spec.crossCuttingConcerns.map((cc) => {
                  const ccDiff = ccDiffMap?.get(cc.id);
                  if (ccDiff?.status === "added") {
                    return <AddedScenarioItem key={cc.id} scenario={cc} />;
                  }
                  if (ccDiff?.status === "changed" && ccDiff.old) {
                    return (
                      <ChangedScenarioItem
                        key={cc.id}
                        scenario={cc}
                        oldScenario={ccDiff.old}
                      />
                    );
                  }
                  return <ScenarioItem key={cc.id} scenario={cc} />;
                })}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <Separator />

      {/* Key Entities */}
      {(spec.keyEntities.length > 0 || removedEntities.length > 0) && (
        <section>
          <h3 className="mb-3 font-semibold text-lg">Key Entities</h3>
          <div className="space-y-2">
            {removedEntities.map(
              (d) =>
                d.old && <RemovedEntityItem key={d.old.name} entity={d.old} />,
            )}
            {spec.keyEntities.map((entity) => {
              const entityDiff = entityDiffMap?.get(entity.name);
              if (entityDiff?.status === "added") {
                return <AddedEntityItem key={entity.name} entity={entity} />;
              }
              if (entityDiff?.status === "changed" && entityDiff.old) {
                return (
                  <ChangedEntityItem
                    key={entity.name}
                    entity={entity}
                    oldEntity={entityDiff.old}
                  />
                );
              }
              return <EntityItem key={entity.name} entity={entity} />;
            })}
          </div>
        </section>
      )}

      {/* Key Decisions */}
      {(spec.keyDecisions.length > 0 || removedDecisions.length > 0) && (
        <section>
          <h3 className="mb-3 font-semibold text-lg">Key Decisions</h3>
          <div className="space-y-2">
            {removedDecisions.map(
              (d) =>
                d.old && (
                  <RemovedDecisionItem key={d.old.choice} decision={d.old} />
                ),
            )}
            {spec.keyDecisions.map((decision) => {
              const decisionDiff = decisionDiffMap?.get(decision.choice);
              if (decisionDiff?.status === "added") {
                return (
                  <AddedDecisionItem
                    key={decision.choice}
                    decision={decision}
                  />
                );
              }
              if (decisionDiff?.status === "changed" && decisionDiff.old) {
                return (
                  <ChangedDecisionItem
                    key={decision.choice}
                    decision={decision}
                    oldDecision={decisionDiff.old}
                  />
                );
              }
              return <DecisionItem key={decision.choice} decision={decision} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
