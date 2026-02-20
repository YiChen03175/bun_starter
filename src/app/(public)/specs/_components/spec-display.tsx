import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AcceptanceScenario,
  KeyDecision,
  KeyEntity,
  UserStory,
} from "@/server/modules/spec/model";

// ---------------------------------------------------------------------------
// Pure base display components — zero diff knowledge
// ---------------------------------------------------------------------------

export function StoryCard({ story }: { story: UserStory }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>
            US{story.number} — {story.title}
          </span>
          <PriorityBadge priority={story.priority} />
        </CardTitle>
        {story.description && (
          <CardDescription>{story.description}</CardDescription>
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
          <AcceptanceScenariosSection scenarios={story.acceptanceScenarios} />
        )}
      </CardContent>
    </Card>
  );
}

export function AcceptanceScenariosSection({
  scenarios,
}: {
  scenarios: AcceptanceScenario[];
}) {
  if (scenarios.length === 0) return null;

  return (
    <div>
      <p className="mb-1 font-medium text-sm">Acceptance Scenarios</p>
      <ul className="space-y-1.5">
        {scenarios.map((sc) => (
          <ScenarioItem key={sc.id} scenario={sc} />
        ))}
      </ul>
    </div>
  );
}

export function ScenarioItem({ scenario }: { scenario: AcceptanceScenario }) {
  return (
    <li className="flex gap-2 text-sm">
      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
        {scenario.id}
      </Badge>
      <span>
        {scenario.edge && (
          <Badge variant="destructive" className="mr-1 text-xs">
            edge
          </Badge>
        )}
        {scenario.text}
      </span>
    </li>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variant =
    priority === "P1" ? "default" : priority === "P2" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="text-xs">
      {priority}
    </Badge>
  );
}

export function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}: </span>
      {children}
    </div>
  );
}

export function EntityItem({ entity }: { entity: KeyEntity }) {
  return (
    <div className="text-sm">
      <div className="font-semibold">{entity.name}</div>
      {entity.description && (
        <div className="text-muted-foreground">{entity.description}</div>
      )}
    </div>
  );
}

export function DecisionItem({ decision }: { decision: KeyDecision }) {
  return (
    <div className="text-sm">
      <div className="font-semibold">{decision.choice}</div>
      {decision.reasoning && (
        <div className="text-muted-foreground">{decision.reasoning}</div>
      )}
    </div>
  );
}
