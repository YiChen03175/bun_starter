import { describe, expect, it } from "bun:test";
import { sampleSpecMarkdown } from "test/fixtures/spec";
import { parseSpec } from "@/server/modules/spec/parser";

describe("parseSpec", () => {
  // Parses structured markdown spec files into JSON following the template format

  it("should extract feature code and title from H1", () => {
    // Acceptance: SP01-US1.4
    // Given a markdown spec with a standard H1
    // When the parser processes it
    const result = parseSpec(sampleSpecMarkdown);

    // Then the feature code and title should be extracted
    expect(result.featureCode).toBe("TF01");
    expect(result.title).toBe("Test Feature");
  });

  it("should parse user stories with all fields", () => {
    // Acceptance: SP01-US1.4
    // Given a markdown spec with user stories
    // When the parser processes it
    const result = parseSpec(sampleSpecMarkdown);

    // Then user stories should have all structured fields
    expect(result.userStories).toHaveLength(1);
    const story = result.userStories[0];
    expect(story.number).toBe(1);
    expect(story.title).toBe("Do Something");
    expect(story.priority).toBe("P1");
    expect(story.whyPriority).toBe("It is important.");
    expect(story.independentTest).toBe("Test by doing the thing.");
  });

  it("should parse acceptance scenarios with IDs", () => {
    // Acceptance: SP01-US1.4
    // Given a user story with acceptance scenarios
    // When the parser processes it
    const result = parseSpec(sampleSpecMarkdown);
    const scenarios = result.userStories[0].acceptanceScenarios;

    // Then each scenario should have an ID and text
    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].id).toBe("US1.1");
    expect(scenarios[0].edge).toBe(false);
    expect(scenarios[0].text).toContain("Given");
  });

  it("should mark edge-tagged scenarios", () => {
    // Acceptance: SP01-US1.5
    // Given a scenario tagged with [edge]
    // When the parser processes it
    const result = parseSpec(sampleSpecMarkdown);
    const scenarios = result.userStories[0].acceptanceScenarios;

    // Then the edge scenario should have edge: true
    expect(scenarios[1].id).toBe("US1.2");
    expect(scenarios[1].edge).toBe(true);
  });

  it("should parse cross-cutting concerns", () => {
    // Acceptance: SP01-US1.4
    // Given a spec with cross-cutting concerns
    // When the parser processes it
    const result = parseSpec(sampleSpecMarkdown);

    // Then cross-cutting concerns should be extracted
    expect(result.crossCuttingConcerns).toHaveLength(1);
    expect(result.crossCuttingConcerns[0].id).toBe("CC1");
    expect(result.crossCuttingConcerns[0].edge).toBe(true);
  });

  it("should parse key entities", () => {
    // Acceptance: SP01-US1.4
    // Given a spec with key entities
    // When the parser processes it
    const result = parseSpec(sampleSpecMarkdown);

    // Then entities should be extracted with name and description
    expect(result.keyEntities).toHaveLength(2);
    expect(result.keyEntities[0].name).toBe("Widget");
    expect(result.keyEntities[0].description).toContain("thing that uses");
    expect(result.keyEntities[1].name).toBe("Gadget");
  });

  it("should parse key decisions", () => {
    // Acceptance: SP01-US1.4
    // Given a spec with key decisions
    // When the parser processes it
    const result = parseSpec(sampleSpecMarkdown);

    // Then decisions should be extracted with choice and reasoning
    expect(result.keyDecisions).toHaveLength(2);
    expect(result.keyDecisions[0].choice).toBe("Use X over Y");
    expect(result.keyDecisions[0].reasoning).toContain("simpler");
  });

  it("should handle spec with no user stories gracefully", () => {
    // Acceptance: SP01-US1.4 (validation)
    // Given a minimal spec with only a title
    const minimal = `# Feature Specification: Empty (EM01)\n\n**Feature Code**: \`EM01\`\n`;

    // When the parser processes it
    const result = parseSpec(minimal);

    // Then it should return empty arrays for all sections
    expect(result.featureCode).toBe("EM01");
    expect(result.title).toBe("Empty");
    expect(result.userStories).toEqual([]);
    expect(result.crossCuttingConcerns).toEqual([]);
    expect(result.keyEntities).toEqual([]);
    expect(result.keyDecisions).toEqual([]);
  });

  it("should extract feature code from paragraph when H1 lacks it", () => {
    // Acceptance: SP01-US1.4
    // Given a markdown spec with a plain H1 and feature code in a paragraph
    const fallbackMarkdown = `# My Feature

**Feature Code**: FB01

## Key Entities

- **Widget**: A thing.
`;

    // When the parser processes it
    const result = parseSpec(fallbackMarkdown);

    // Then the feature code should be extracted from the paragraph fallback
    expect(result.featureCode).toBe("FB01");
    expect(result.keyEntities).toHaveLength(1);
  });

  it("should return empty strings for missing optional story fields", () => {
    // Acceptance: SP01-US1.4
    // Given a user story without "Why this priority" and "Independent Test"
    const minimalStory = `# Feature Specification: Minimal (MN01)

**Feature Code**: \`MN01\`

## User Stories

### User Story 1 - Basic (Priority: P1)

A basic story.

**Acceptance Scenarios**:

1. **US1.1** — **Given** X, **When** Y, **Then** Z.
`;

    // When the parser processes it
    const result = parseSpec(minimalStory);

    // Then optional fields should be empty strings
    expect(result.userStories).toHaveLength(1);
    expect(result.userStories[0].whyPriority).toBe("");
    expect(result.userStories[0].independentTest).toBe("");
  });
});
