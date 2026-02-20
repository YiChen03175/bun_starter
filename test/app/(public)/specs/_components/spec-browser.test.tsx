import { describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createQueryWrapper,
  EdenProvider,
  useEden,
  useEdenClient,
} from "test/helpers/eden-query";
import type { ParsedSpec } from "@/server/modules/spec/model";

mock.module("@/lib/eden", () => ({ api: {} }));
mock.module("@/lib/eden-query", () => ({
  EdenProvider,
  useEden,
  useEdenClient,
}));

const { SpecBrowser } = await import(
  "@/app/(public)/specs/_components/spec-browser"
);

const specs = [
  { code: "KB01-kanban-board", title: "Kanban Board" },
  { code: "SP01-spec-browser", title: "Spec Browser" },
];

const baseSpec: ParsedSpec = {
  featureCode: "KB01",
  title: "Kanban Board",
  userStories: [],
  crossCuttingConcerns: [],
  keyEntities: [],
  keyDecisions: [],
};

const richSpec: ParsedSpec = {
  featureCode: "KB01",
  title: "Kanban Board",
  userStories: [
    {
      number: 1,
      title: "View board",
      priority: "P1",
      description: "User can view their board",
      whyPriority: "Core feature",
      independentTest: "Open /board and see columns",
      acceptanceScenarios: [
        { id: "US1.1", text: "Board shows all columns", edge: false },
      ],
    },
  ],
  crossCuttingConcerns: [
    { id: "CC1", text: "All actions require auth", edge: false },
  ],
  keyEntities: [{ name: "Board", description: "A kanban board" }],
  keyDecisions: [
    { choice: "Use Drizzle ORM", reasoning: "Type-safe SQL queries" },
  ],
};

function createMockClient(specsByCode?: Record<string, ParsedSpec>) {
  const specMap = specsByCode ?? { "KB01-kanban-board": baseSpec };
  return {
    api: {
      specs: (params: { code: string }) => ({
        get: () =>
          Promise.resolve({
            data: specMap[params.code] ?? baseSpec,
            error: null,
          }),
      }),
    },
  };
}

function createNeverResolvingClient() {
  return {
    api: {
      specs: (_params: { code: string }) => ({
        get: () => new Promise(() => {}),
      }),
    },
  };
}

function renderSpecBrowser(
  props: {
    specs?: typeof specs;
    devChanges?: Parameters<typeof SpecBrowser>[0]["devChanges"];
  } = {},
  clientOverride?: { specsByCode?: Record<string, ParsedSpec> },
) {
  const mockClient = createMockClient(clientOverride?.specsByCode);
  const { Wrapper } = createQueryWrapper(mockClient);
  return render(
    <SpecBrowser specs={props.specs ?? specs} devChanges={props.devChanges} />,
    { wrapper: Wrapper },
  );
}

function renderSpecBrowserNeverResolving(
  props: {
    specs?: typeof specs;
    devChanges?: Parameters<typeof SpecBrowser>[0]["devChanges"];
  } = {},
) {
  const mockClient = createNeverResolvingClient();
  const { Wrapper } = createQueryWrapper(mockClient);
  return render(
    <SpecBrowser specs={props.specs ?? specs} devChanges={props.devChanges} />,
    { wrapper: Wrapper },
  );
}

describe("SpecBrowser sidebar", () => {
  // Sidebar status indicators and layout for the spec browser

  it("should display spec titles and feature codes in the sidebar", () => {
    // Acceptance: SP01-US2.1
    // Given a list of specs exists
    // When the sidebar renders
    renderSpecBrowser();

    // Then each spec title and code should be visible
    expect(screen.getByText("Kanban Board")).toBeInTheDocument();
    expect(screen.getByText("KB01-kanban-board")).toBeInTheDocument();
    expect(screen.getByText("Spec Browser")).toBeInTheDocument();
    expect(screen.getByText("SP01-spec-browser")).toBeInTheDocument();
  });

  it("should sort changed specs to the top of the sidebar", () => {
    // Acceptance: SP01-US3.4
    // Given three specs where only the last one is modified
    const threeSpecs = [
      { code: "AA01-alpha", title: "Alpha" },
      { code: "BB01-beta", title: "Beta" },
      { code: "CC01-gamma", title: "Gamma" },
    ];
    const devChanges = [
      {
        code: "CC01-gamma",
        status: "modified" as const,
        diff: {
          userStories: [],
          crossCuttingConcerns: [],
          keyEntities: [],
          keyDecisions: [],
        },
      },
    ];

    // When the sidebar renders
    renderSpecBrowser({ specs: threeSpecs, devChanges });

    // Then the modified spec should appear before the unchanged ones
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("Gamma");
    expect(buttons[1]).toHaveTextContent("Alpha");
    expect(buttons[2]).toHaveTextContent("Beta");
  });

  it("should show a small yellow dot for modified specs", () => {
    // Acceptance: SP01-US3.8
    // Given a spec has been modified
    const devChanges = [
      {
        code: "KB01-kanban-board",
        status: "modified" as const,
        diff: {
          userStories: [],
          crossCuttingConcerns: [],
          keyEntities: [],
          keyDecisions: [],
        },
      },
    ];

    // When the sidebar renders
    const { container } = renderSpecBrowser({ devChanges });

    // Then a small yellow dot should be visible
    const dot = container.querySelector(".bg-yellow-500");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("h-1", "w-1", "rounded-full");
  });

  it("should show a small green dot for new specs", () => {
    // Acceptance: SP01-US3.8
    // Given a new untracked spec exists
    const devChanges = [
      {
        code: "NW01-new-feature",
        status: "new" as const,
        diff: null,
      },
    ];
    const allSpecs = [
      ...specs,
      { code: "NW01-new-feature", title: "New Feature" },
    ];

    // When the sidebar renders
    const { container } = renderSpecBrowser({
      specs: allSpecs,
      devChanges,
    });

    // Then a small green dot should be visible
    const dot = container.querySelector(".bg-green-500");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("h-1", "w-1", "rounded-full");
  });

  it("should show strikethrough for deleted specs", () => {
    // Acceptance: SP01-US3.8
    // Given a spec folder has been deleted
    const devChanges = [
      {
        code: "DL01-deleted-feature",
        status: "deleted" as const,
        diff: null,
        title: "Deleted Feature",
      },
    ];

    // When the sidebar renders
    renderSpecBrowser({ devChanges });

    // Then the title should have strikethrough styling
    expect(screen.getByText("Deleted Feature")).toHaveClass("line-through");
  });

  it("should not show dev indicators when devChanges is empty", () => {
    // Acceptance: SP01-US3.6
    // Given the app is running in production (no dev changes)
    // When the sidebar renders without any devChanges
    const { container } = renderSpecBrowser({ devChanges: [] });

    // Then no colored dots or diff badges should be shown
    expect(container.querySelector(".bg-yellow-500")).not.toBeInTheDocument();
    expect(container.querySelector(".bg-green-500")).not.toBeInTheDocument();
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByText("−")).not.toBeInTheDocument();
  });

  it("should not show the old large dot or badge for changed specs", () => {
    // Acceptance: SP01-US3.8
    // Given a modified spec
    const devChanges = [
      {
        code: "KB01-kanban-board",
        status: "modified" as const,
        diff: {
          userStories: [],
          crossCuttingConcerns: [],
          keyEntities: [],
          keyDecisions: [],
        },
      },
    ];

    // When the sidebar renders
    renderSpecBrowser({ devChanges });

    // Then no large dot character or "new" badge text should be present
    expect(screen.queryByText("●")).not.toBeInTheDocument();
    expect(screen.queryByText("new")).not.toBeInTheDocument();
  });
});

describe("SpecBrowser detail panel", () => {
  // Detail panel rendering for selected spec content and diff indicators

  it("should show parsed spec content when a spec is selected", async () => {
    // Acceptance: SP01-US2.2
    // Given a spec with user stories, entities, and decisions
    renderSpecBrowser({}, { specsByCode: { "KB01-kanban-board": richSpec } });

    // When the first spec is auto-selected and the query resolves
    // Then the detail panel should show the spec content
    await waitFor(() => {
      expect(screen.getByText("User Stories")).toBeInTheDocument();
    });
    expect(screen.getByText("KB01")).toBeInTheDocument();
    expect(screen.getByText(/US1 — View board/)).toBeInTheDocument();
    expect(screen.getByText("Key Entities")).toBeInTheDocument();
    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Key Decisions")).toBeInTheDocument();
    expect(screen.getByText("Use Drizzle ORM")).toBeInTheDocument();
  });

  it("should show spec content when a different spec is clicked", async () => {
    // Acceptance: SP01-US2.2
    // Given the sidebar has two specs with different content
    const user = userEvent.setup();
    const spSpec: ParsedSpec = {
      featureCode: "SP01",
      title: "Spec Browser",
      userStories: [
        {
          number: 2,
          title: "Browse specs",
          priority: "P1",
          description: "User can browse all specs",
          whyPriority: "Essential",
          independentTest: "Open /specs",
          acceptanceScenarios: [],
        },
      ],
      crossCuttingConcerns: [],
      keyEntities: [],
      keyDecisions: [],
    };
    renderSpecBrowser(
      {},
      {
        specsByCode: {
          "KB01-kanban-board": richSpec,
          "SP01-spec-browser": spSpec,
        },
      },
    );

    // When the user clicks the second spec in the sidebar
    await user.click(screen.getByRole("button", { name: /Spec Browser/i }));

    // Then the detail panel should show the clicked spec's content
    await waitFor(() => {
      expect(screen.getByText("SP01")).toBeInTheDocument();
    });
    expect(screen.getByText(/US2 — Browse specs/)).toBeInTheDocument();
  });

  it("should show loading skeleton while spec is being fetched", () => {
    // Acceptance: SP01-US2.2 (loading state)
    // Given a spec query that never resolves
    const { container } = renderSpecBrowserNeverResolving();

    // Then loading skeletons should be visible while data loads
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render base story cards when no diff is present", async () => {
    // Acceptance: SP01-US2.2
    // Given a spec with stories and no dev changes
    renderSpecBrowser({}, { specsByCode: { "KB01-kanban-board": richSpec } });

    // When the detail panel loads
    await waitFor(() => {
      expect(screen.getByText(/US1 — View board/)).toBeInTheDocument();
    });

    // Then base story cards should render without diff indicators
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByText("−")).not.toBeInTheDocument();
  });

  it("should render added/changed/removed story cards based on diff", async () => {
    // Acceptance: SP01-US3.5
    // Given a modified spec with added, changed, and removed stories in the diff
    const specWithStories: ParsedSpec = {
      featureCode: "KB01",
      title: "Kanban Board",
      userStories: [
        {
          number: 1,
          title: "View board",
          priority: "P1",
          description: "User can view board",
          whyPriority: "Core",
          independentTest: "Open /board",
          acceptanceScenarios: [],
        },
        {
          number: 3,
          title: "New story",
          priority: "P2",
          description: "Brand new story",
          whyPriority: "Nice to have",
          independentTest: "Test new",
          acceptanceScenarios: [],
        },
      ],
      crossCuttingConcerns: [],
      keyEntities: [],
      keyDecisions: [],
    };
    const devChanges = [
      {
        code: "KB01-kanban-board",
        status: "modified" as const,
        diff: {
          userStories: [
            {
              status: "changed" as const,
              old: {
                number: 1,
                title: "View board",
                priority: "P2",
                description: "Old description",
                whyPriority: "Core",
                independentTest: "Open /board",
                acceptanceScenarios: [],
              },
              new: specWithStories.userStories[0],
            },
            {
              status: "removed" as const,
              old: {
                number: 2,
                title: "Delete board",
                priority: "P3",
                description: "User can delete board",
                whyPriority: "Cleanup",
                independentTest: "Delete board",
                acceptanceScenarios: [],
              },
            },
            {
              status: "added" as const,
              new: specWithStories.userStories[1],
            },
          ],
          crossCuttingConcerns: [],
          keyEntities: [],
          keyDecisions: [],
        },
      },
    ];

    renderSpecBrowser(
      { devChanges },
      { specsByCode: { "KB01-kanban-board": specWithStories } },
    );

    // When the detail panel loads with diff data
    await waitFor(() => {
      expect(screen.getByText(/US1 — View board/)).toBeInTheDocument();
    });

    // Then added story card should have a "+" badge
    expect(screen.getByText(/US3 — New story/)).toBeInTheDocument();
    const plusBadges = screen.getAllByText("+");
    expect(plusBadges.length).toBeGreaterThanOrEqual(1);

    // Then removed story card should have a "−" badge and strikethrough
    expect(screen.getByText(/US2 — Delete board/)).toBeInTheDocument();
    const minusBadges = screen.getAllByText("−");
    expect(minusBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("should render diff indicators for entities and decisions", async () => {
    // Acceptance: SP01-US3.5
    // Given a modified spec with added entities and decisions in the diff
    const specWithExtras: ParsedSpec = {
      featureCode: "KB01",
      title: "Kanban Board",
      userStories: [],
      crossCuttingConcerns: [],
      keyEntities: [{ name: "Column", description: "A kanban column" }],
      keyDecisions: [
        { choice: "Use React Query", reasoning: "Caching and state" },
      ],
    };
    const devChanges = [
      {
        code: "KB01-kanban-board",
        status: "modified" as const,
        diff: {
          userStories: [],
          crossCuttingConcerns: [],
          keyEntities: [
            {
              status: "added" as const,
              new: { name: "Column", description: "A kanban column" },
            },
          ],
          keyDecisions: [
            {
              status: "added" as const,
              new: {
                choice: "Use React Query",
                reasoning: "Caching and state",
              },
            },
          ],
        },
      },
    ];

    renderSpecBrowser(
      { devChanges },
      { specsByCode: { "KB01-kanban-board": specWithExtras } },
    );

    // When the detail panel loads
    await waitFor(() => {
      expect(screen.getByText("Column")).toBeInTheDocument();
    });

    // Then added entity and decision should show "+" diff badges
    expect(screen.getByText("Use React Query")).toBeInTheDocument();
    const plusBadges = screen.getAllByText("+");
    expect(plusBadges.length).toBe(2);
  });

  it("should render added, changed, and removed CC diff indicators", async () => {
    // Acceptance: SP01-US3.5
    // Given a modified spec with cross-cutting concerns that are added, changed, and removed
    const specWithCCs: ParsedSpec = {
      featureCode: "KB01",
      title: "Kanban Board",
      userStories: [],
      crossCuttingConcerns: [
        { id: "CC1", text: "Updated auth required", edge: false },
        { id: "CC3", text: "New concern", edge: false },
      ],
      keyEntities: [],
      keyDecisions: [],
    };
    const devChanges = [
      {
        code: "KB01-kanban-board",
        status: "modified" as const,
        diff: {
          userStories: [],
          crossCuttingConcerns: [
            {
              status: "changed" as const,
              old: { id: "CC1", text: "Auth required", edge: false },
              new: { id: "CC1", text: "Updated auth required", edge: false },
            },
            {
              status: "removed" as const,
              old: { id: "CC2", text: "Logging required", edge: false },
            },
            {
              status: "added" as const,
              new: { id: "CC3", text: "New concern", edge: false },
            },
          ],
          keyEntities: [],
          keyDecisions: [],
        },
      },
    ];

    renderSpecBrowser(
      { devChanges },
      { specsByCode: { "KB01-kanban-board": specWithCCs } },
    );

    // When the detail panel loads with CC diff data
    await waitFor(() => {
      expect(screen.getByText("Cross-Cutting Concerns")).toBeInTheDocument();
    });

    // Then added CC should show "+" badge
    expect(screen.getByText("New concern")).toBeInTheDocument();
    const plusBadges = screen.getAllByText("+");
    expect(plusBadges.length).toBeGreaterThanOrEqual(1);

    // Then removed CC should show "−" badge
    expect(screen.getByText("Logging required")).toBeInTheDocument();
    const minusBadges = screen.getAllByText("−");
    expect(minusBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("should render changed and removed entity diff indicators", async () => {
    // Acceptance: SP01-US3.5
    // Given a modified spec with changed and removed entities
    const specWithEntities: ParsedSpec = {
      featureCode: "KB01",
      title: "Kanban Board",
      userStories: [],
      crossCuttingConcerns: [],
      keyEntities: [
        { name: "Board", description: "Updated board description" },
      ],
      keyDecisions: [],
    };
    const devChanges = [
      {
        code: "KB01-kanban-board",
        status: "modified" as const,
        diff: {
          userStories: [],
          crossCuttingConcerns: [],
          keyEntities: [
            {
              status: "changed" as const,
              old: { name: "Board", description: "A kanban board" },
              new: { name: "Board", description: "Updated board description" },
            },
            {
              status: "removed" as const,
              old: { name: "Column", description: "A column in the board" },
            },
          ],
          keyDecisions: [],
        },
      },
    ];

    const { container } = renderSpecBrowser(
      { devChanges },
      { specsByCode: { "KB01-kanban-board": specWithEntities } },
    );

    // When the detail panel loads with entity diff data
    await waitFor(() => {
      expect(screen.getByText("Key Entities")).toBeInTheDocument();
    });

    // Then changed entity should show inline diff (strikethrough + green)
    expect(container.querySelector(".line-through")).toBeInTheDocument();
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();

    // Then removed entity should show "−" badge
    expect(screen.getByText("Column")).toBeInTheDocument();
    expect(screen.getAllByText("−").length).toBeGreaterThanOrEqual(1);
  });

  it("should render changed and removed decision diff indicators", async () => {
    // Acceptance: SP01-US3.5
    // Given a modified spec with changed and removed decisions
    const specWithDecisions: ParsedSpec = {
      featureCode: "KB01",
      title: "Kanban Board",
      userStories: [],
      crossCuttingConcerns: [],
      keyEntities: [],
      keyDecisions: [
        {
          choice: "Use Drizzle ORM",
          reasoning: "Updated reasoning for type safety",
        },
      ],
    };
    const devChanges = [
      {
        code: "KB01-kanban-board",
        status: "modified" as const,
        diff: {
          userStories: [],
          crossCuttingConcerns: [],
          keyEntities: [],
          keyDecisions: [
            {
              status: "changed" as const,
              old: {
                choice: "Use Drizzle ORM",
                reasoning: "Type-safe SQL queries",
              },
              new: {
                choice: "Use Drizzle ORM",
                reasoning: "Updated reasoning for type safety",
              },
            },
            {
              status: "removed" as const,
              old: { choice: "Use REST", reasoning: "Simple API" },
            },
          ],
        },
      },
    ];

    const { container } = renderSpecBrowser(
      { devChanges },
      { specsByCode: { "KB01-kanban-board": specWithDecisions } },
    );

    // When the detail panel loads with decision diff data
    await waitFor(() => {
      expect(screen.getByText("Key Decisions")).toBeInTheDocument();
    });

    // Then changed decision should show inline diff
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();

    // Then removed decision should show "−" badge
    expect(screen.getByText("Use REST")).toBeInTheDocument();
    expect(screen.getAllByText("−").length).toBeGreaterThanOrEqual(1);
  });

  it("should show deleted spec content without diff overlay", async () => {
    // Acceptance: SP01-US3.9
    // Given a spec has been deleted and has last-committed content available
    const deletedSpec: ParsedSpec = {
      featureCode: "DL01",
      title: "Deleted Feature",
      userStories: [
        {
          number: 1,
          title: "Old feature",
          priority: "P3",
          description: "This feature was removed",
          whyPriority: "Low priority",
          independentTest: "N/A",
          acceptanceScenarios: [
            { id: "US1.1", text: "Feature worked", edge: false },
          ],
        },
      ],
      crossCuttingConcerns: [],
      keyEntities: [{ name: "Widget", description: "A removed widget" }],
      keyDecisions: [],
    };
    const devChanges = [
      {
        code: "DL01-deleted-feature",
        status: "deleted" as const,
        diff: null,
        title: "Deleted Feature",
      },
    ];

    renderSpecBrowser(
      { devChanges },
      { specsByCode: { "DL01-deleted-feature": deletedSpec } },
    );

    // When the deleted spec is auto-selected (sorted to top) and the detail loads
    await waitFor(() => {
      expect(screen.getByText("DL01")).toBeInTheDocument();
    });

    // Then the spec content should render as base display (no diff overlay)
    expect(screen.getByText(/US1 — Old feature/)).toBeInTheDocument();
    expect(screen.getByText("Widget")).toBeInTheDocument();

    // Then no diff badges should be present
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByText("−")).not.toBeInTheDocument();
  });
});
