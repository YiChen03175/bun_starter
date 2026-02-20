import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  AddedDecisionItem,
  AddedEntityItem,
  AddedScenarioItem,
  AddedStoryCard,
  ChangedDecisionItem,
  ChangedEntityItem,
  ChangedField,
  ChangedScenarioItem,
  ChangedStoryCard,
  DiffAcceptanceScenariosSection,
  DiffStatusBadge,
  InlineDiff,
  RemovedDecisionItem,
  RemovedEntityItem,
  RemovedScenarioItem,
  RemovedStoryCard,
} from "@/app/(public)/specs/_components/spec-diff";

describe("DiffStatusBadge", () => {
  // Renders add/remove status badges for diff indicators

  it("should render + for added status", () => {
    // Acceptance: SP01-US3.5
    // Given an added diff status
    // Then the badge should show a + symbol with green styling
    render(<DiffStatusBadge status="added" />);
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("should render − for removed status", () => {
    // Acceptance: SP01-US3.5
    // Given a removed diff status
    // Then the badge should show a − symbol with red styling
    render(<DiffStatusBadge status="removed" />);
    expect(screen.getByText("−")).toBeInTheDocument();
  });
});

describe("InlineDiff", () => {
  // Renders word-level diff segments with color-coded styling

  it("should render unchanged text as plain spans", () => {
    // Acceptance: SP01-US3.5
    // Given identical old and new text
    // Then the text should render without diff styling
    render(<InlineDiff oldText="hello world" newText="hello world" />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("should render removed words with strikethrough and added words with green", () => {
    // Acceptance: SP01-US3.5
    // Given old text "hello world" and new text "hello universe"
    // Then "world" should appear with strikethrough styling
    // Then "universe" should appear with green styling
    const { container } = render(
      <InlineDiff oldText="hello world" newText="hello universe" />,
    );
    const strikethrough = container.querySelector(".line-through");
    expect(strikethrough).toBeInTheDocument();
    expect(strikethrough?.textContent).toContain("world");

    const green = container.querySelector(".text-green-600");
    expect(green).toBeInTheDocument();
    expect(green?.textContent).toContain("universe");
  });
});

describe("ChangedField", () => {
  // Renders a labeled inline diff for story card fields

  it("should render label with inline diff", () => {
    // Acceptance: SP01-US3.5
    // Given a label and changed values
    // Then the label should be displayed followed by the diff
    render(<ChangedField label="Priority" oldVal="P1" newVal="P2" />);
    expect(screen.getByText("Priority:")).toBeInTheDocument();
  });

  it("should render without label when omitted", () => {
    // Acceptance: SP01-US3.5
    // Given no label and changed values
    // Then only the diff content should render
    const { container } = render(
      <ChangedField oldVal="old text" newVal="new text" />,
    );
    expect(container.querySelector(".text-sm")).toBeInTheDocument();
    expect(screen.queryByText(/:/)).not.toBeInTheDocument();
  });
});

describe("AddedScenarioItem", () => {
  // Renders an added acceptance scenario with green text and + badge

  it("should render with + badge and green text", () => {
    // Acceptance: SP01-US3.5
    // Given an added acceptance scenario
    // Then it should display the + badge, scenario ID, and green text
    render(
      <ul>
        <AddedScenarioItem
          scenario={{ id: "US1.1", text: "new scenario", edge: false }}
        />
      </ul>,
    );
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("US1.1")).toBeInTheDocument();
    expect(screen.getByText("new scenario")).toHaveClass("text-green-600");
  });
});

describe("ChangedScenarioItem", () => {
  // Renders an acceptance scenario with inline word-level diff

  it("should render inline diff without ~ badge", () => {
    // Acceptance: SP01-US3.5
    // Given a changed acceptance scenario
    // Then it should show inline diff for the text
    // Then no ~ badge should be present
    const { container } = render(
      <ul>
        <ChangedScenarioItem
          scenario={{ id: "CC1", text: "new text here", edge: false }}
          oldScenario={{ id: "CC1", text: "old text here", edge: false }}
        />
      </ul>,
    );
    expect(screen.getByText("CC1")).toBeInTheDocument();
    // Verify inline diff is rendered (red strikethrough + green)
    expect(container.querySelector(".line-through")).toBeInTheDocument();
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
    // No ~ badge
    expect(screen.queryByText("~")).not.toBeInTheDocument();
  });
});

describe("RemovedScenarioItem", () => {
  // Renders a removed acceptance scenario with strikethrough and − badge

  it("should render with − badge and strikethrough text", () => {
    // Acceptance: SP01-US3.5
    // Given a removed acceptance scenario
    // Then it should display the − badge and strikethrough text
    render(
      <ul>
        <RemovedScenarioItem
          scenario={{ id: "US2.1", text: "removed scenario", edge: false }}
        />
      </ul>,
    );
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText("US2.1")).toBeInTheDocument();
    expect(screen.getByText("removed scenario")).toHaveClass("line-through");
  });
});

describe("AddedStoryCard", () => {
  // Renders an added user story card with green border and + badge

  it("should render with + badge and green border", () => {
    // Acceptance: SP01-US3.5
    // Given an added user story
    // Then it should display the + badge, story title, and green styling
    render(
      <AddedStoryCard
        story={{
          number: 4,
          title: "New Story",
          priority: "P1",
          description: "A new feature",
          whyPriority: "Critical",
          independentTest: "Test it",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText(/US4 — New Story/)).toHaveClass("text-green-600");
    expect(screen.getByText("A new feature")).toBeInTheDocument();
  });

  it("should render acceptance scenarios when present", () => {
    // Acceptance: SP01-US3.5
    // Given an added user story with acceptance scenarios
    // Then the scenarios should be rendered inside the card
    render(
      <AddedStoryCard
        story={{
          number: 5,
          title: "Story With Scenarios",
          priority: "P2",
          description: "Has scenarios",
          whyPriority: "",
          independentTest: "",
          acceptanceScenarios: [
            { id: "US5.1", text: "First scenario", edge: false },
            { id: "US5.2", text: "Second scenario", edge: true },
          ],
        }}
      />,
    );
    expect(screen.getByText("Acceptance Scenarios")).toBeInTheDocument();
    expect(screen.getByText("US5.1")).toBeInTheDocument();
    expect(screen.getByText("First scenario")).toBeInTheDocument();
    expect(screen.getByText("US5.2")).toBeInTheDocument();
  });
});

describe("RemovedStoryCard", () => {
  // Renders a removed user story card with red border, − badge, and strikethrough

  it("should render with − badge and strikethrough title", () => {
    // Acceptance: SP01-US3.5
    // Given a removed user story
    // Then it should display the − badge and strikethrough title
    render(
      <RemovedStoryCard
        story={{
          number: 2,
          title: "Old Story",
          priority: "P2",
          description: "",
          whyPriority: "",
          independentTest: "",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText(/US2 — Old Story/)).toHaveClass("line-through");
  });
});

describe("AddedEntityItem", () => {
  // Renders an added key entity with green text and + badge

  it("should render with + badge and entity name/description", () => {
    // Acceptance: SP01-US3.5
    // Given an added key entity
    // Then it should display the + badge, entity name, and description in green
    render(
      <AddedEntityItem
        entity={{ name: "NewEntity", description: "A new entity" }}
      />,
    );
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("NewEntity")).toHaveClass("text-green-600");
    expect(screen.getByText(/A new entity/)).toBeInTheDocument();
  });
});

describe("ChangedEntityItem", () => {
  // Renders a changed key entity with inline diff on description

  it("should render entity name with inline diff on description and no badge", () => {
    // Acceptance: SP01-US3.5
    // Given a changed key entity with modified description
    // Then it should show the entity name and inline diff
    // Then no status badge should be present
    const { container } = render(
      <ChangedEntityItem
        entity={{ name: "Task", description: "updated description" }}
        oldEntity={{ name: "Task", description: "original description" }}
      />,
    );
    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(container.querySelector(".line-through")).toBeInTheDocument();
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
    // No +/− badge
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByText("−")).not.toBeInTheDocument();
  });
});

describe("RemovedEntityItem", () => {
  // Renders a removed key entity with strikethrough and − badge

  it("should render with − badge and strikethrough", () => {
    // Acceptance: SP01-US3.5
    // Given a removed key entity
    // Then it should display the − badge and strikethrough name/description
    render(
      <RemovedEntityItem
        entity={{ name: "OldEntity", description: "gone now" }}
      />,
    );
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText("OldEntity")).toHaveClass("line-through");
  });
});

describe("AddedDecisionItem", () => {
  // Renders an added key decision with green text and + badge

  it("should render with + badge and decision choice/reasoning", () => {
    // Acceptance: SP01-US3.5
    // Given an added key decision
    // Then it should display the + badge, choice, and reasoning in green
    render(
      <AddedDecisionItem
        decision={{ choice: "Use Redis", reasoning: "Fast caching" }}
      />,
    );
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("Use Redis")).toHaveClass("text-green-600");
    expect(screen.getByText(/Fast caching/)).toBeInTheDocument();
  });
});

describe("ChangedDecisionItem", () => {
  // Renders a changed key decision with inline diff on reasoning

  it("should render decision choice with inline diff on reasoning and no badge", () => {
    // Acceptance: SP01-US3.5
    // Given a changed key decision with modified reasoning
    // Then it should show the choice and inline diff on reasoning
    // Then no status badge should be present
    const { container } = render(
      <ChangedDecisionItem
        decision={{ choice: "Use Postgres", reasoning: "new reason here" }}
        oldDecision={{ choice: "Use Postgres", reasoning: "old reason here" }}
      />,
    );
    expect(screen.getByText("Use Postgres")).toBeInTheDocument();
    expect(container.querySelector(".line-through")).toBeInTheDocument();
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByText("−")).not.toBeInTheDocument();
  });
});

describe("RemovedDecisionItem", () => {
  // Renders a removed key decision with strikethrough and − badge

  it("should render with − badge and strikethrough", () => {
    // Acceptance: SP01-US3.5
    // Given a removed key decision
    // Then it should display the − badge and strikethrough choice/reasoning
    render(
      <RemovedDecisionItem
        decision={{ choice: "Old Choice", reasoning: "outdated" }}
      />,
    );
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText("Old Choice")).toHaveClass("line-through");
  });
});

describe("ChangedStoryCard", () => {
  // Renders a changed user story card with yellow border and field-level diffs

  it("should render with yellow border and changed description", () => {
    // Acceptance: SP01-US3.5
    // Given a story with a changed description
    // Then the card should have a yellow left border and show inline diff
    const { container } = render(
      <ChangedStoryCard
        story={{
          number: 1,
          title: "View Board",
          priority: "P1",
          description: "Updated description",
          whyPriority: "Core feature",
          independentTest: "",
          acceptanceScenarios: [],
        }}
        oldStory={{
          number: 1,
          title: "View Board",
          priority: "P1",
          description: "Original description",
          whyPriority: "Core feature",
          independentTest: "",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText(/US1 — View Board/)).toBeInTheDocument();
    // Inline diff should be rendered for description
    expect(container.querySelector(".line-through")).toBeInTheDocument();
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
  });

  it("should show changed priority field", () => {
    // Acceptance: SP01-US3.5
    // Given a story with changed priority
    // Then the priority change should be displayed
    render(
      <ChangedStoryCard
        story={{
          number: 2,
          title: "Task",
          priority: "P1",
          description: "Same",
          whyPriority: "Same",
          independentTest: "",
          acceptanceScenarios: [],
        }}
        oldStory={{
          number: 2,
          title: "Task",
          priority: "P2",
          description: "Same",
          whyPriority: "Same",
          independentTest: "",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText("Priority:")).toBeInTheDocument();
  });

  it("should render unchanged fields normally", () => {
    // Acceptance: SP01-US3.5
    // Given a story where only the description changed
    // Then unchanged fields should render as plain text
    render(
      <ChangedStoryCard
        story={{
          number: 3,
          title: "Test",
          priority: "P1",
          description: "New desc",
          whyPriority: "Core",
          independentTest: "Test it",
          acceptanceScenarios: [],
        }}
        oldStory={{
          number: 3,
          title: "Test",
          priority: "P1",
          description: "Old desc",
          whyPriority: "Core",
          independentTest: "Test it",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText("Why this priority:")).toBeInTheDocument();
    expect(screen.getByText("Independent test:")).toBeInTheDocument();
  });

  it("should show changed whyPriority field with inline diff", () => {
    // Acceptance: SP01-US3.5
    // Given a story where whyPriority changed
    // Then the whyPriority field should render as a ChangedField with diff
    const { container } = render(
      <ChangedStoryCard
        story={{
          number: 4,
          title: "Priority Test",
          priority: "P1",
          description: "Same",
          whyPriority: "Updated reason",
          independentTest: "Same test",
          acceptanceScenarios: [],
        }}
        oldStory={{
          number: 4,
          title: "Priority Test",
          priority: "P1",
          description: "Same",
          whyPriority: "Original reason",
          independentTest: "Same test",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText("Why this priority:")).toBeInTheDocument();
    // The diff should show strikethrough for old and green for new
    const whySection = container.querySelectorAll(".line-through");
    expect(whySection.length).toBeGreaterThanOrEqual(1);
  });

  it("should show changed independentTest field with inline diff", () => {
    // Acceptance: SP01-US3.5
    // Given a story where independentTest changed
    // Then the independentTest field should render as a ChangedField with diff
    const { container } = render(
      <ChangedStoryCard
        story={{
          number: 5,
          title: "Test Field",
          priority: "P1",
          description: "Same",
          whyPriority: "Same",
          independentTest: "New test approach",
          acceptanceScenarios: [],
        }}
        oldStory={{
          number: 5,
          title: "Test Field",
          priority: "P1",
          description: "Same",
          whyPriority: "Same",
          independentTest: "Old test approach",
          acceptanceScenarios: [],
        }}
      />,
    );
    expect(screen.getByText("Independent test:")).toBeInTheDocument();
    const diffs = container.querySelectorAll(".text-green-600");
    expect(diffs.length).toBeGreaterThanOrEqual(1);
  });
});

describe("DiffAcceptanceScenariosSection", () => {
  // Renders acceptance scenarios with added/changed/removed diff indicators

  it("should show added scenarios with + badge", () => {
    // Acceptance: SP01-US3.5
    // Given a new scenario not in old scenarios
    // Then it should render with the + badge
    render(
      <DiffAcceptanceScenariosSection
        scenarios={[{ id: "US1.1", text: "New scenario", edge: false }]}
        oldScenarios={[]}
      />,
    );
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("New scenario")).toHaveClass("text-green-600");
  });

  it("should show removed scenarios with − badge", () => {
    // Acceptance: SP01-US3.5
    // Given an old scenario not in current scenarios
    // Then it should render with the − badge and strikethrough
    render(
      <DiffAcceptanceScenariosSection
        scenarios={[]}
        oldScenarios={[{ id: "US1.1", text: "Old scenario", edge: false }]}
      />,
    );
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText("Old scenario")).toHaveClass("line-through");
  });

  it("should show changed scenarios with inline diff", () => {
    // Acceptance: SP01-US3.5
    // Given a scenario with changed text
    // Then it should render inline diff
    const { container } = render(
      <DiffAcceptanceScenariosSection
        scenarios={[{ id: "US1.1", text: "updated text", edge: false }]}
        oldScenarios={[{ id: "US1.1", text: "original text", edge: false }]}
      />,
    );
    expect(container.querySelector(".line-through")).toBeInTheDocument();
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
  });

  it("should show unchanged scenarios as plain items", () => {
    // Acceptance: SP01-US3.5
    // Given a scenario with identical text
    // Then it should render as a plain scenario item
    render(
      <DiffAcceptanceScenariosSection
        scenarios={[{ id: "US1.1", text: "same text", edge: false }]}
        oldScenarios={[{ id: "US1.1", text: "same text", edge: false }]}
      />,
    );
    expect(screen.getByText("US1.1")).toBeInTheDocument();
    expect(screen.getByText("same text")).toBeInTheDocument();
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByText("−")).not.toBeInTheDocument();
  });

  it("should return null when both arrays are empty", () => {
    // Acceptance: SP01-US3.5
    // Given no scenarios in either array
    // Then nothing should be rendered
    const { container } = render(
      <DiffAcceptanceScenariosSection scenarios={[]} oldScenarios={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
