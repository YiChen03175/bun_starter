import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { diffWords } from "@/lib/diff-words";
import { cn } from "@/lib/utils";
import type {
  AcceptanceScenario,
  KeyDecision,
  KeyEntity,
  UserStory,
} from "@/server/modules/spec/model";
import { Detail, PriorityBadge, ScenarioItem } from "./spec-display";

// ---------------------------------------------------------------------------
// Shared diff primitives
// ---------------------------------------------------------------------------

export function DiffStatusBadge({ status }: { status: "added" | "removed" }) {
  const config = {
    added: {
      label: "+",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    removed: {
      label: "\u2212",
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  };
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded font-bold font-mono text-xs",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function InlineDiff({
  oldText,
  newText,
}: {
  oldText: string;
  newText: string;
}) {
  const segments = diffWords(oldText, newText);
  return (
    <>
      {segments.map((seg, i) => {
        const key = `${seg.type}-${i}`;
        if (seg.type === "remove") {
          return (
            <span key={key} className="text-red-500/70 line-through">
              {seg.text}{" "}
            </span>
          );
        }
        if (seg.type === "add") {
          return (
            <span key={key} className="text-green-600">
              {seg.text}{" "}
            </span>
          );
        }
        return <span key={key}>{seg.text} </span>;
      })}
    </>
  );
}

export function ChangedField({
  label,
  oldVal,
  newVal,
}: {
  label?: string;
  oldVal: string;
  newVal: string;
}) {
  const segments = diffWords(oldVal, newVal);

  return (
    <div className="text-sm">
      {label && (
        <span className="font-medium text-muted-foreground">{label}: </span>
      )}
      {segments.map((seg, i) => {
        const key = `${seg.type}-${i}`;
        if (seg.type === "remove") {
          return (
            <span key={key} className="text-red-500/70 line-through">
              {seg.text}{" "}
            </span>
          );
        }
        if (seg.type === "add") {
          return (
            <span key={key} className="text-green-600">
              {seg.text}{" "}
            </span>
          );
        }
        return <span key={key}>{seg.text} </span>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario diff components
// ---------------------------------------------------------------------------

export function AddedScenarioItem({
  scenario,
}: {
  scenario: AcceptanceScenario;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <DiffStatusBadge status="added" />
      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
        {scenario.id}
      </Badge>
      <span className="text-green-600">{scenario.text}</span>
    </li>
  );
}

export function ChangedScenarioItem({
  scenario,
  oldScenario,
}: {
  scenario: AcceptanceScenario;
  oldScenario: AcceptanceScenario;
}) {
  return (
    <li className="flex gap-2 text-sm">
      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
        {scenario.id}
      </Badge>
      <span>
        <InlineDiff oldText={oldScenario.text} newText={scenario.text} />
      </span>
    </li>
  );
}

export function RemovedScenarioItem({
  scenario,
}: {
  scenario: AcceptanceScenario;
}) {
  return (
    <li className="flex items-center gap-2 text-sm opacity-50">
      <DiffStatusBadge status="removed" />
      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
        {scenario.id}
      </Badge>
      <span className="line-through">{scenario.text}</span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Story card diff components
// ---------------------------------------------------------------------------

export function AddedStoryCard({ story }: { story: UserStory }) {
  return (
    <Card size="sm" className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DiffStatusBadge status="added" />
          <span className="text-green-600">
            US{story.number} — {story.title}
          </span>
          <PriorityBadge priority={story.priority} />
        </CardTitle>
        {story.description && (
          <CardDescription className="text-green-600/70">
            {story.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {story.whyPriority && (
          <Detail label="Why this priority">{story.whyPriority}</Detail>
        )}
        {story.independentTest && (
          <Detail label="Independent test">{story.independentTest}</Detail>
        )}
        {story.acceptanceScenarios.length > 0 && (
          <div>
            <p className="mb-1 font-medium text-sm">Acceptance Scenarios</p>
            <ul className="space-y-1.5">
              {story.acceptanceScenarios.map((sc) => (
                <ScenarioItem key={sc.id} scenario={sc} />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChangedStoryCard({
  story,
  oldStory,
}: {
  story: UserStory;
  oldStory: UserStory;
}) {
  return (
    <Card size="sm" className="border-l-4 border-l-yellow-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>
            US{story.number} — {story.title}
          </span>
          <PriorityBadge priority={story.priority} />
        </CardTitle>
        {oldStory.description !== story.description ? (
          <ChangedField
            oldVal={oldStory.description}
            newVal={story.description}
          />
        ) : (
          story.description && (
            <CardDescription>{story.description}</CardDescription>
          )
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {oldStory.priority !== story.priority && (
          <ChangedField
            label="Priority"
            oldVal={oldStory.priority}
            newVal={story.priority}
          />
        )}
        {oldStory.whyPriority !== story.whyPriority ? (
          <ChangedField
            label="Why this priority"
            oldVal={oldStory.whyPriority}
            newVal={story.whyPriority}
          />
        ) : (
          story.whyPriority && (
            <Detail label="Why this priority">{story.whyPriority}</Detail>
          )
        )}
        {oldStory.independentTest !== story.independentTest ? (
          <ChangedField
            label="Independent test"
            oldVal={oldStory.independentTest}
            newVal={story.independentTest}
          />
        ) : (
          story.independentTest && (
            <Detail label="Independent test">{story.independentTest}</Detail>
          )
        )}
        {(story.acceptanceScenarios.length > 0 ||
          oldStory.acceptanceScenarios.length > 0) && (
          <DiffAcceptanceScenariosSection
            scenarios={story.acceptanceScenarios}
            oldScenarios={oldStory.acceptanceScenarios}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function RemovedStoryCard({ story }: { story: UserStory }) {
  return (
    <Card size="sm" className="border-l-4 border-l-red-500 opacity-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DiffStatusBadge status="removed" />
          <span className="line-through">
            US{story.number} — {story.title}
          </span>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Diff acceptance scenarios section
// ---------------------------------------------------------------------------

export function DiffAcceptanceScenariosSection({
  scenarios,
  oldScenarios,
}: {
  scenarios: AcceptanceScenario[];
  oldScenarios: AcceptanceScenario[];
}) {
  const currentIds = new Set(scenarios.map((s) => s.id));
  const removedScenarios = oldScenarios.filter((s) => !currentIds.has(s.id));
  const oldMap = new Map(oldScenarios.map((s) => [s.id, s]));

  if (scenarios.length === 0 && removedScenarios.length === 0) return null;

  return (
    <div>
      <p className="mb-1 font-medium text-sm">Acceptance Scenarios</p>
      <ul className="space-y-1.5">
        {removedScenarios.map((sc) => (
          <RemovedScenarioItem key={sc.id} scenario={sc} />
        ))}
        {scenarios.map((sc) => {
          const oldSc = oldMap.get(sc.id);
          if (!oldSc) return <AddedScenarioItem key={sc.id} scenario={sc} />;
          if (oldSc.text !== sc.text) {
            return (
              <ChangedScenarioItem
                key={sc.id}
                scenario={sc}
                oldScenario={oldSc}
              />
            );
          }
          return <ScenarioItem key={sc.id} scenario={sc} />;
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entity diff components
// ---------------------------------------------------------------------------

export function AddedEntityItem({ entity }: { entity: KeyEntity }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <DiffStatusBadge status="added" />
      <div>
        <div className="font-semibold text-green-600">{entity.name}</div>
        {entity.description && (
          <div className="text-green-600/70">{entity.description}</div>
        )}
      </div>
    </div>
  );
}

export function ChangedEntityItem({
  entity,
  oldEntity,
}: {
  entity: KeyEntity;
  oldEntity: KeyEntity;
}) {
  return (
    <div className="text-sm">
      <div className="font-semibold">{entity.name}</div>
      {entity.description && oldEntity.description && (
        <div className="text-muted-foreground">
          <InlineDiff
            oldText={oldEntity.description}
            newText={entity.description}
          />
        </div>
      )}
    </div>
  );
}

export function RemovedEntityItem({ entity }: { entity: KeyEntity }) {
  return (
    <div className="flex items-start gap-2 text-sm opacity-50">
      <DiffStatusBadge status="removed" />
      <div>
        <div className="font-semibold line-through">{entity.name}</div>
        {entity.description && (
          <div className="text-muted-foreground line-through">
            {entity.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision diff components
// ---------------------------------------------------------------------------

export function AddedDecisionItem({ decision }: { decision: KeyDecision }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <DiffStatusBadge status="added" />
      <div>
        <div className="font-semibold text-green-600">{decision.choice}</div>
        {decision.reasoning && (
          <div className="text-green-600/70">{decision.reasoning}</div>
        )}
      </div>
    </div>
  );
}

export function ChangedDecisionItem({
  decision,
  oldDecision,
}: {
  decision: KeyDecision;
  oldDecision: KeyDecision;
}) {
  return (
    <div className="text-sm">
      <div className="font-semibold">{decision.choice}</div>
      {decision.reasoning && oldDecision.reasoning && (
        <div className="text-muted-foreground">
          <InlineDiff
            oldText={oldDecision.reasoning}
            newText={decision.reasoning}
          />
        </div>
      )}
    </div>
  );
}

export function RemovedDecisionItem({ decision }: { decision: KeyDecision }) {
  return (
    <div className="flex items-start gap-2 text-sm opacity-50">
      <DiffStatusBadge status="removed" />
      <div>
        <div className="font-semibold line-through">{decision.choice}</div>
        {decision.reasoning && (
          <div className="text-muted-foreground line-through">
            {decision.reasoning}
          </div>
        )}
      </div>
    </div>
  );
}
