import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  AcceptanceScenariosSection,
  DecisionItem,
  Detail,
  EntityItem,
  PriorityBadge,
  ScenarioItem,
  StoryCard,
} from "@/app/(public)/specs/_components/spec-display";

describe("PriorityBadge", () => {
  // Renders a priority badge with variant styling based on priority level

  it("should render with default variant for P1", () => {
    // Acceptance: SP01-US2.2
    // Given a P1 priority
    // Then the badge should render with default variant
    render(<PriorityBadge priority="P1" />);
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("should render with secondary variant for P2", () => {
    // Acceptance: SP01-US2.2
    // Given a P2 priority
    // Then the badge should render with secondary variant
    render(<PriorityBadge priority="P2" />);
    expect(screen.getByText("P2")).toBeInTheDocument();
  });

  it("should render with outline variant for P3", () => {
    // Acceptance: SP01-US2.2
    // Given a P3 priority
    // Then the badge should render with outline variant
    render(<PriorityBadge priority="P3" />);
    expect(screen.getByText("P3")).toBeInTheDocument();
  });
});

describe("ScenarioItem", () => {
  // Renders an acceptance scenario with ID badge and text

  it("should render scenario ID and text", () => {
    // Acceptance: SP01-US2.2
    // Given a scenario with ID and text
    // Then both should be displayed
    render(
      <ul>
        <ScenarioItem
          scenario={{ id: "US1.1", text: "User can log in", edge: false }}
        />
      </ul>,
    );
    expect(screen.getByText("US1.1")).toBeInTheDocument();
    expect(screen.getByText("User can log in")).toBeInTheDocument();
  });

  it("should render edge badge when scenario is an edge case", () => {
    // Acceptance: SP01-US2.2
    // Given a scenario marked as edge case
    // Then the edge badge should be visible
    render(
      <ul>
        <ScenarioItem
          scenario={{ id: "US1.2", text: "Handles timeout", edge: true }}
        />
      </ul>,
    );
    expect(screen.getByText("edge")).toBeInTheDocument();
  });
});

describe("Detail", () => {
  // Renders a labeled detail field

  it("should render label and children", () => {
    // Acceptance: SP01-US2.3
    // Given a label and content
    // Then both should be displayed
    render(<Detail label="Why this priority">Because it's critical</Detail>);
    expect(screen.getByText("Why this priority:")).toBeInTheDocument();
    expect(screen.getByText("Because it's critical")).toBeInTheDocument();
  });
});

describe("StoryCard", () => {
  // Renders a user story card with title, priority, description, and scenarios

  it("should render story title and priority badge", () => {
    // Acceptance: SP01-US2.2
    // Given a user story with title and priority
    // Then the title and priority badge should be displayed
    render(
      <StoryCard
        story={{
          number: 1,
          title: "View Board",
          priority: "P1",
          description: "User can view the board",
          whyPriority: "Core feature",
          independentTest: "Load the board page",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText(/US1 — View Board/)).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("User can view the board")).toBeInTheDocument();
    expect(screen.getByText("Core feature")).toBeInTheDocument();
    expect(screen.getByText("Load the board page")).toBeInTheDocument();
  });

  it("should render acceptance scenarios when present", () => {
    // Acceptance: SP01-US2.2
    // Given a story with acceptance scenarios
    // Then the scenarios should be displayed
    render(
      <StoryCard
        story={{
          number: 2,
          title: "Create Task",
          priority: "P2",
          description: "",
          whyPriority: "",
          independentTest: "",
          acceptanceScenarios: [
            { id: "US2.1", text: "Task is persisted", edge: false },
          ],
        }}
      />,
    );
    expect(screen.getByText("Acceptance Scenarios")).toBeInTheDocument();
    expect(screen.getByText("US2.1")).toBeInTheDocument();
    expect(screen.getByText("Task is persisted")).toBeInTheDocument();
  });

  it("should not render empty optional fields", () => {
    // Acceptance: SP01-US2.2
    // Given a story with empty optional fields
    // Then those fields should not be displayed
    render(
      <StoryCard
        story={{
          number: 3,
          title: "Minimal Story",
          priority: "P3",
          description: "",
          whyPriority: "",
          independentTest: "",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.queryByText("Why this priority:")).not.toBeInTheDocument();
    expect(screen.queryByText("Independent test:")).not.toBeInTheDocument();
    expect(screen.queryByText("Acceptance Scenarios")).not.toBeInTheDocument();
  });
});

describe("AcceptanceScenariosSection", () => {
  // Renders a list of acceptance scenarios

  it("should render all scenarios", () => {
    // Acceptance: SP01-US2.2
    // Given multiple scenarios
    // Then all should be displayed
    render(
      <AcceptanceScenariosSection
        scenarios={[
          { id: "US1.1", text: "First scenario", edge: false },
          { id: "US1.2", text: "Second scenario", edge: true },
        ]}
      />,
    );
    expect(screen.getByText("US1.1")).toBeInTheDocument();
    expect(screen.getByText("US1.2")).toBeInTheDocument();
  });

  it("should return null for empty scenarios", () => {
    // Acceptance: SP01-US2.2
    // Given no scenarios
    // Then nothing should be rendered
    const { container } = render(<AcceptanceScenariosSection scenarios={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("EntityItem", () => {
  // Renders a key entity with name and optional description

  it("should render entity name and description", () => {
    // Acceptance: SP01-US2.3
    // Given an entity with name and description
    // Then both should be displayed
    render(
      <EntityItem entity={{ name: "Task", description: "A work item" }} />,
    );
    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(screen.getByText(/A work item/)).toBeInTheDocument();
  });

  it("should render without description when empty", () => {
    // Acceptance: SP01-US2.3
    // Given an entity with no description
    // Then only the name should be displayed
    render(<EntityItem entity={{ name: "Column", description: "" }} />);
    expect(screen.getByText("Column")).toBeInTheDocument();
  });
});

describe("DecisionItem", () => {
  // Renders a key decision with choice and optional reasoning

  it("should render decision choice and reasoning", () => {
    // Acceptance: SP01-US2.3
    // Given a decision with choice and reasoning
    // Then both should be displayed
    render(
      <DecisionItem
        decision={{ choice: "Use Postgres", reasoning: "Reliable RDBMS" }}
      />,
    );
    expect(screen.getByText("Use Postgres")).toBeInTheDocument();
    expect(screen.getByText(/Reliable RDBMS/)).toBeInTheDocument();
  });

  it("should render without reasoning when empty", () => {
    // Acceptance: SP01-US2.3
    // Given a decision with no reasoning
    // Then only the choice should be displayed
    render(<DecisionItem decision={{ choice: "Use Redis", reasoning: "" }} />);
    expect(screen.getByText("Use Redis")).toBeInTheDocument();
  });
});
