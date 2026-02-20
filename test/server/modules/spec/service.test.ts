import { afterEach, describe, expect, it, mock } from "bun:test";
import { NotFoundError } from "elysia";
import {
  fullNewSpecMarkdown,
  fullOldSpecMarkdown,
  newSpecMarkdown,
  oldSpecMarkdown,
} from "test/fixtures/spec";

const mockStatus = mock(() => ({
  not_added: [] as string[],
  modified: [] as string[],
  staged: [] as string[],
  deleted: [] as string[],
  created: [] as string[],
}));

const mockShow = mock(() => "");

mock.module("simple-git", () => ({
  simpleGit: () => ({
    status: mockStatus,
    show: mockShow,
  }),
}));

const mockReadFile = mock(() => "");
const mockReaddir = mock(() => [] as unknown[]);
mock.module("node:fs/promises", () => ({
  readdir: mockReaddir,
  readFile: mockReadFile,
}));

import "test/helpers/mock-logger";

// Mutable env mock — tests control NODE_ENV by mutating this object
const mockEnv = { NODE_ENV: "test" as string };
mock.module("@/env", () => ({ env: mockEnv }));

const { SpecService } = await import("@/server/modules/spec/service");

describe("SpecService.getDevChanges", () => {
  // Dev-only git change detection for spec files

  afterEach(() => {
    mockStatus.mockReset();
    mockShow.mockReset();
    mockReadFile.mockReset();
    mockReaddir.mockReset();
    mockEnv.NODE_ENV = "test";
  });

  it("should throw NotFoundError when not in development mode", async () => {
    // Acceptance: SP01-US3.1
    // Given the app is running in production
    mockEnv.NODE_ENV = "production";

    // When dev changes are requested
    // Then it should throw NotFoundError to signal the feature is unavailable
    await expect(SpecService.getDevChanges()).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("should report staged new files as new", async () => {
    // Acceptance: SP01-US3.3
    // Given a spec file has been staged as a new file (appears in status.created)
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: [],
      staged: [],
      deleted: [],
      created: ["specs/CR01-created-feature/spec.md"],
    });

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the spec should appear as new with no diff
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      code: "CR01-created-feature",
      status: "new",
      diff: null,
    });
  });

  it("should report untracked spec files as new", async () => {
    // Acceptance: SP01-US3.3
    // Given a new spec file has been created but not committed
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: ["specs/NW01-new-feature/spec.md"],
      modified: [],
      staged: [],
      deleted: [],
      created: [],
    });

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the spec should appear as new with no diff
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      code: "NW01-new-feature",
      status: "new",
      diff: null,
    });
  });

  it("should detect structural changes in modified spec files", async () => {
    // Acceptance: SP01-US3.2
    // Given an existing spec has a new user story added in the working copy
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: ["specs/TF01-test/spec.md"],
      staged: [],
      deleted: [],
      created: [],
    });
    mockShow.mockReturnValueOnce(oldSpecMarkdown);
    mockReadFile.mockReturnValueOnce(newSpecMarkdown);

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the spec should be reported as modified with the added user story in the diff
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("TF01-test");
    expect(result[0].status).toBe("modified");
    expect(result[0].diff).not.toBeNull();
    expect(result[0].diff?.userStories).toHaveLength(1);
    expect(result[0].diff?.userStories[0].status).toBe("added");
    expect(result[0].diff?.userStories[0].new?.number).toBe(2);
  });

  it("should detect deleted spec files from git status", async () => {
    // Acceptance: SP01-US3.9
    // Given a spec folder has been deleted from disk but exists in the last commit
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: [],
      staged: [],
      deleted: ["specs/DL01-deleted-feature/spec.md"],
      created: [],
    });
    mockShow.mockReturnValueOnce(oldSpecMarkdown);

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the deleted spec should appear with status "deleted" and its committed title
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("DL01-deleted-feature");
    expect(result[0].status).toBe("deleted");
    expect(result[0].diff).toBeNull();
    expect(result[0].title).toBe("Test");
  });

  it("should detect changed and removed user stories", async () => {
    // Acceptance: SP01-US3.2
    // Given an existing spec where US1 description changed and US2 was removed
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: ["specs/FL01-full/spec.md"],
      staged: [],
      deleted: [],
      created: [],
    });
    mockShow.mockReturnValueOnce(fullOldSpecMarkdown);
    mockReadFile.mockReturnValueOnce(fullNewSpecMarkdown);

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the diff should contain changed US1, removed US2, and added US3
    expect(result).toHaveLength(1);
    const stories = result[0].diff?.userStories ?? [];
    expect(stories.find((s) => s.status === "changed")?.old?.number).toBe(1);
    expect(stories.find((s) => s.status === "removed")?.old?.number).toBe(2);
    expect(stories.find((s) => s.status === "added")?.new?.number).toBe(3);
  });

  it("should detect added, changed, and removed cross-cutting concerns", async () => {
    // Acceptance: SP01-US3.2
    // Given an existing spec where CC1 text changed, CC2 removed, CC3 added
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: ["specs/FL01-full/spec.md"],
      staged: [],
      deleted: [],
      created: [],
    });
    mockShow.mockReturnValueOnce(fullOldSpecMarkdown);
    mockReadFile.mockReturnValueOnce(fullNewSpecMarkdown);

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the diff should contain changed CC1, removed CC2, and added CC3
    const ccs = result[0].diff?.crossCuttingConcerns ?? [];
    expect(ccs.find((c) => c.status === "changed")?.old?.id).toBe("CC1");
    expect(ccs.find((c) => c.status === "removed")?.old?.id).toBe("CC2");
    expect(ccs.find((c) => c.status === "added")?.new?.id).toBe("CC3");
  });

  it("should detect added, changed, and removed key entities", async () => {
    // Acceptance: SP01-US3.2
    // Given an existing spec where Item description changed, Category removed, Tag added
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: ["specs/FL01-full/spec.md"],
      staged: [],
      deleted: [],
      created: [],
    });
    mockShow.mockReturnValueOnce(fullOldSpecMarkdown);
    mockReadFile.mockReturnValueOnce(fullNewSpecMarkdown);

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the diff should contain changed Item, removed Category, and added Tag
    const entities = result[0].diff?.keyEntities ?? [];
    expect(entities.find((e) => e.status === "changed")?.old?.name).toBe(
      "Item",
    );
    expect(entities.find((e) => e.status === "removed")?.old?.name).toBe(
      "Category",
    );
    expect(entities.find((e) => e.status === "added")?.new?.name).toBe("Tag");
  });

  it("should detect added, changed, and removed key decisions", async () => {
    // Acceptance: SP01-US3.2
    // Given an existing spec where Use REST reasoning changed, Use Postgres removed, Use Redis added
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: ["specs/FL01-full/spec.md"],
      staged: [],
      deleted: [],
      created: [],
    });
    mockShow.mockReturnValueOnce(fullOldSpecMarkdown);
    mockReadFile.mockReturnValueOnce(fullNewSpecMarkdown);

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the diff should contain changed Use REST, removed Use Postgres, and added Use Redis
    const decisions = result[0].diff?.keyDecisions ?? [];
    expect(decisions.find((d) => d.status === "changed")?.old?.choice).toBe(
      "Use REST",
    );
    expect(decisions.find((d) => d.status === "removed")?.old?.choice).toBe(
      "Use Postgres",
    );
    expect(decisions.find((d) => d.status === "added")?.new?.choice).toBe(
      "Use Redis",
    );
  });

  it("should silently skip when git.show fails for a deleted spec", async () => {
    // Acceptance: SP01-US3.9 (validation)
    // Given a spec file is deleted but git.show fails to retrieve committed content
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: [],
      staged: [],
      deleted: ["specs/DL01-deleted-feature/spec.md"],
      created: [],
    });
    mockShow.mockImplementationOnce(() => {
      throw new Error("fatal: path not found");
    });

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the deleted spec should be silently skipped
    expect(result).toHaveLength(0);
  });

  it("should treat as new when git.show fails for a modified spec", async () => {
    // Acceptance: SP01-US3.2 (validation)
    // Given a modified spec file exists but git.show fails to retrieve committed version
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: ["specs/MD01-modified-feature/spec.md"],
      staged: [],
      deleted: [],
      created: [],
    });
    mockShow.mockImplementationOnce(() => {
      throw new Error("fatal: path not found");
    });

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then the spec should appear as new with no diff
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      code: "MD01-modified-feature",
      status: "new",
      diff: null,
    });
  });

  it("should deduplicate files appearing in both modified and staged", async () => {
    // Acceptance: SP01-US3.2
    // Given a spec file appears in both modified and staged git status
    mockEnv.NODE_ENV = "development";
    mockStatus.mockReturnValueOnce({
      not_added: [],
      modified: ["specs/FL01-full/spec.md"],
      staged: ["specs/FL01-full/spec.md"],
      deleted: [],
      created: [],
    });
    mockShow.mockReturnValueOnce(fullOldSpecMarkdown);
    mockReadFile.mockReturnValueOnce(fullNewSpecMarkdown);

    // When dev changes are requested
    const result = await SpecService.getDevChanges();

    // Then only one change entry should be produced (deduplicated)
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("FL01-full");
  });
});

describe("SpecService.list", () => {
  // Lists spec summaries from the specs directory with caching

  afterEach(() => {
    mockReaddir.mockReset();
    mockReadFile.mockReset();
    mockEnv.NODE_ENV = "test";
  });

  it("should return cached specs on second call when not in development mode", async () => {
    // Acceptance: SP01-CC1
    // Given a spec directory with one spec
    const entry = { name: "TF01-test", isDirectory: () => true };
    mockReaddir.mockReturnValue([entry]);
    mockReadFile.mockReturnValue(oldSpecMarkdown);

    // When list() is called the first time
    const first = await SpecService.list();
    expect(first).toHaveLength(1);
    expect(first[0].title).toBe("Test");

    // When list() is called again after readFile starts failing
    mockReadFile.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    // Then it should still return the cached spec (readFile not needed)
    const second = await SpecService.list();
    expect(second).toHaveLength(1);
    expect(second[0].title).toBe("Test");
  });

  it("should bypass cache in development mode", async () => {
    // Acceptance: SP01-CC1
    // Given a spec has been fetched and cached
    const entry = { name: "TF01-test", isDirectory: () => true };
    mockReaddir.mockReturnValue([entry]);
    mockReadFile.mockReturnValue(oldSpecMarkdown);
    mockEnv.NODE_ENV = "development";

    await SpecService.list();

    // When list() is called again in development mode
    mockReadFile.mockClear();
    mockReadFile.mockReturnValue(oldSpecMarkdown);
    await SpecService.list();

    // Then readFile should be called again (cache bypassed)
    expect(mockReadFile).toHaveBeenCalled();
  });
});

describe("SpecService.get", () => {
  // Retrieves a parsed spec by code, with git fallback for deleted specs in dev mode

  afterEach(() => {
    mockShow.mockReset();
    mockReadFile.mockReset();
    mockEnv.NODE_ENV = "test";
  });

  it("should return committed content when spec file is deleted in dev mode", async () => {
    // Acceptance: SP01-US3.9
    // Given a spec file has been deleted from disk but exists in git
    mockEnv.NODE_ENV = "development";
    mockReadFile.mockImplementationOnce(() => {
      throw new Error("ENOENT");
    });
    mockShow.mockReturnValueOnce(oldSpecMarkdown);

    // When the spec is requested
    const result = await SpecService.get("TF01-test");

    // Then it should return the committed version from git
    expect(result.title).toBe("Test");
    expect(result.featureCode).toBe("TF01");
  });

  it("should throw NotFoundError when spec does not exist in git or on disk", async () => {
    // Acceptance: SP01-US3.9 (edge)
    // Given a spec code that does not exist anywhere
    mockEnv.NODE_ENV = "development";
    mockReadFile.mockImplementationOnce(() => {
      throw new Error("ENOENT");
    });
    mockShow.mockImplementationOnce(() => {
      throw new Error("Not found in git");
    });

    // When the spec is requested
    // Then it should throw NotFoundError
    await expect(SpecService.get("nonexistent")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("should return cached spec on second call when not in development mode", async () => {
    // Acceptance: SP01-CC1
    // Given a spec has been fetched and cached
    mockReadFile.mockReturnValueOnce(oldSpecMarkdown);
    const first = await SpecService.get("cached-spec");
    expect(first.title).toBe("Test");

    // When the same spec is requested again after readFile starts failing
    mockReadFile.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    // Then it should return the cached version without reading the file
    const second = await SpecService.get("cached-spec");
    expect(second.title).toBe("Test");
  });

  it("should bypass cache in development mode", async () => {
    // Acceptance: SP01-CC1
    // Given a spec has been fetched and cached
    mockReadFile.mockReturnValueOnce(oldSpecMarkdown);
    mockEnv.NODE_ENV = "development";
    await SpecService.get("dev-cache-test");

    // When the same spec is requested again in development mode
    mockReadFile.mockClear();
    mockReadFile.mockReturnValueOnce(oldSpecMarkdown);
    await SpecService.get("dev-cache-test");

    // Then readFile should be called again (cache bypassed)
    expect(mockReadFile).toHaveBeenCalled();
  });
});
