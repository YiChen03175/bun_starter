import { describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "elysia";
import { createTestClient } from "test/helpers/elysia";
import "test/helpers/mock-auth";
import "test/helpers/mock-logger";
import type { ParsedSpec, SpecChange } from "@/server/modules/spec/model";

const mockParsedSpec: ParsedSpec = {
  featureCode: "TF01",
  title: "Test Feature",
  userStories: [
    {
      number: 1,
      title: "Do Something",
      priority: "P1",
      description: "Users can do something.",
      whyPriority: "Important.",
      independentTest: "Test it.",
      acceptanceScenarios: [
        { id: "US1.1", text: "Given X, When Y, Then Z.", edge: false },
      ],
    },
  ],
  crossCuttingConcerns: [],
  keyEntities: [{ name: "Widget", description: "A thing." }],
  keyDecisions: [{ choice: "Use X", reasoning: "Simpler." }],
};

const serviceMock = {
  list: mock(() => [{ code: "TF01-test-feature", title: "Test Feature" }]),
  get: mock((code: string) => {
    if (code === "nonexistent") throw new NotFoundError("Spec not found");
    return mockParsedSpec;
  }),
  getDevChanges: mock((): SpecChange[] => {
    throw new NotFoundError("Dev changes not available");
  }),
};

mock.module("@/server/modules/spec/service", () => ({
  SpecService: serviceMock,
}));

const { app } = await import("@/server");
const client = createTestClient(app);

describe("Spec Controller", () => {
  // Public API for browsing parsed feature specifications

  describe("GET /api/specs", () => {
    it("should return a list of spec summaries", async () => {
      // Acceptance: SP01-US1.1
      // When a GET request is made to /api/specs
      const res = await client.request("/api/specs");

      // Then it should return 200 with spec summaries
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([
        { code: "TF01-test-feature", title: "Test Feature" },
      ]);
    });
  });

  describe("GET /api/specs/:code", () => {
    it("should return the full parsed spec", async () => {
      // Acceptance: SP01-US1.2
      // When a GET request is made for a valid spec code
      const res = await client.request("/api/specs/TF01-test-feature");

      // Then it should return 200 with the full parsed spec
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.featureCode).toBe("TF01");
      expect(body.title).toBe("Test Feature");
      expect(body.userStories).toHaveLength(1);
      expect(body.keyEntities).toHaveLength(1);
    });

    it("should return 404 when spec does not exist", async () => {
      // Acceptance: SP01-US1.3
      // When a GET request is made for a nonexistent spec code
      const res = await client.request("/api/specs/nonexistent");

      // Then it should return 404
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/specs/dev/changes", () => {
    it("should return 404 when the feature is unavailable", async () => {
      // Acceptance: SP01-US3.1
      // When the dev changes endpoint is called
      const res = await client.request("/api/specs/dev/changes");

      // Then it should return 404 to signal the feature is not available
      expect(res.status).toBe(404);
    });

    it("should return structured diff data for modified specs", async () => {
      // Acceptance: SP01-US3.2
      // Given a spec has uncommitted structural changes
      const mockChanges: SpecChange[] = [
        {
          code: "TF01-test-feature",
          status: "modified",
          diff: {
            userStories: [
              { status: "added", new: mockParsedSpec.userStories[0] },
            ],
            crossCuttingConcerns: [],
            keyEntities: [],
            keyDecisions: [],
          },
        },
      ];
      serviceMock.getDevChanges.mockReturnValueOnce(mockChanges);

      // When the dev changes endpoint is called
      const res = await client.request("/api/specs/dev/changes");

      // Then the response should include the change entry with its diff
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].code).toBe("TF01-test-feature");
      expect(body[0].status).toBe("modified");
      expect(body[0].diff.userStories).toHaveLength(1);
    });

    it("should return deleted specs with title and null diff", async () => {
      // Acceptance: SP01-US3.9
      // Given a spec folder has been deleted from disk
      const mockChanges: SpecChange[] = [
        {
          code: "DL01-deleted-feature",
          status: "deleted",
          diff: null,
          title: "Deleted Feature",
        },
      ];
      serviceMock.getDevChanges.mockReturnValueOnce(mockChanges);

      // When the dev changes endpoint is called
      const res = await client.request("/api/specs/dev/changes");

      // Then the response should include the deleted entry with title
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(1);
      expect(body[0].code).toBe("DL01-deleted-feature");
      expect(body[0].status).toBe("deleted");
      expect(body[0].diff).toBeNull();
      expect(body[0].title).toBe("Deleted Feature");
    });
  });
});
