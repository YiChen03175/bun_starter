import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { NotFoundError } from "elysia";
import { env } from "@/env";
import { logger } from "@/server/logger";
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
} from "./model";
import { parseSpec } from "./parser";

const SPECS_DIR = join(process.cwd(), "specs");

const specCache = new Map<string, ParsedSpec>();

function computeStructuredDiff(
  oldSpec: ParsedSpec,
  newSpec: ParsedSpec,
): SpecStructuredDiff {
  const userStories: DiffItem<UserStory>[] = [];
  const oldStoryMap = new Map(oldSpec.userStories.map((s) => [s.number, s]));
  const newStoryMap = new Map(newSpec.userStories.map((s) => [s.number, s]));
  for (const [num, story] of newStoryMap) {
    const old = oldStoryMap.get(num);
    if (!old) {
      userStories.push({ status: "added", new: story });
    } else if (JSON.stringify(old) !== JSON.stringify(story)) {
      userStories.push({ status: "changed", old, new: story });
    }
  }
  for (const [num, story] of oldStoryMap) {
    if (!newStoryMap.has(num)) {
      userStories.push({ status: "removed", old: story });
    }
  }

  const crossCuttingConcerns: DiffItem<AcceptanceScenario>[] = [];
  const oldCCMap = new Map(oldSpec.crossCuttingConcerns.map((c) => [c.id, c]));
  const newCCMap = new Map(newSpec.crossCuttingConcerns.map((c) => [c.id, c]));
  for (const [id, cc] of newCCMap) {
    const old = oldCCMap.get(id);
    if (!old) {
      crossCuttingConcerns.push({ status: "added", new: cc });
    } else if (old.text !== cc.text || old.edge !== cc.edge) {
      crossCuttingConcerns.push({ status: "changed", old, new: cc });
    }
  }
  for (const [id, cc] of oldCCMap) {
    if (!newCCMap.has(id)) {
      crossCuttingConcerns.push({ status: "removed", old: cc });
    }
  }

  const keyEntities: DiffItem<KeyEntity>[] = [];
  const oldEntityMap = new Map(oldSpec.keyEntities.map((e) => [e.name, e]));
  const newEntityMap = new Map(newSpec.keyEntities.map((e) => [e.name, e]));
  for (const [name, entity] of newEntityMap) {
    const old = oldEntityMap.get(name);
    if (!old) {
      keyEntities.push({ status: "added", new: entity });
    } else if (old.description !== entity.description) {
      keyEntities.push({ status: "changed", old, new: entity });
    }
  }
  for (const [name, entity] of oldEntityMap) {
    if (!newEntityMap.has(name)) {
      keyEntities.push({ status: "removed", old: entity });
    }
  }

  const keyDecisions: DiffItem<KeyDecision>[] = [];
  const oldDecisionMap = new Map(
    oldSpec.keyDecisions.map((d) => [d.choice, d]),
  );
  const newDecisionMap = new Map(
    newSpec.keyDecisions.map((d) => [d.choice, d]),
  );
  for (const [choice, decision] of newDecisionMap) {
    const old = oldDecisionMap.get(choice);
    if (!old) {
      keyDecisions.push({ status: "added", new: decision });
    } else if (old.reasoning !== decision.reasoning) {
      keyDecisions.push({ status: "changed", old, new: decision });
    }
  }
  for (const [choice, decision] of oldDecisionMap) {
    if (!newDecisionMap.has(choice)) {
      keyDecisions.push({ status: "removed", old: decision });
    }
  }

  return { userStories, crossCuttingConcerns, keyEntities, keyDecisions };
}

function hasDiffChanges(diff: SpecStructuredDiff): boolean {
  return (
    diff.userStories.length > 0 ||
    diff.crossCuttingConcerns.length > 0 ||
    diff.keyEntities.length > 0 ||
    diff.keyDecisions.length > 0
  );
}

async function readSpecFile(specPath: string): Promise<string | null> {
  try {
    return await readFile(specPath, "utf-8");
  } catch {
    return null;
  }
}

export const SpecService = {
  async list(): Promise<SpecSummary[]> {
    const entries = await readdir(SPECS_DIR, { withFileTypes: true });
    const specs: SpecSummary[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

      if (env.NODE_ENV !== "development") {
        const cached = specCache.get(entry.name);
        if (cached) {
          specs.push({ code: entry.name, title: cached.title });
          continue;
        }
      }

      const specPath = join(SPECS_DIR, entry.name, "spec.md");
      const markdown = await readSpecFile(specPath);
      if (!markdown) continue;

      const parsed = parseSpec(markdown);
      specCache.set(entry.name, parsed);
      specs.push({ code: entry.name, title: parsed.title });
    }

    return specs.sort((a, b) => a.code.localeCompare(b.code));
  },

  async get(code: string): Promise<ParsedSpec> {
    if (env.NODE_ENV !== "development") {
      const cached = specCache.get(code);
      if (cached) return cached;
    }

    const specPath = join(SPECS_DIR, code, "spec.md");
    const markdown = await readSpecFile(specPath);
    if (!markdown) {
      // Dev fallback: file deleted on disk, try committed version from git
      if (env.NODE_ENV === "development") {
        try {
          const { simpleGit } = await import("simple-git");
          const git = simpleGit(process.cwd());
          const committed = await git.show(`HEAD:specs/${code}/spec.md`);
          return parseSpec(committed);
        } catch (error) {
          logger.debug(
            { code, error },
            "Spec not found in git, will throw NotFoundError",
          );
        }
      }
      throw new NotFoundError(`Spec "${code}" not found`);
    }

    const parsed = parseSpec(markdown);
    specCache.set(code, parsed);
    return parsed;
  },

  async getDevChanges(): Promise<SpecChange[]> {
    if (env.NODE_ENV !== "development") {
      throw new NotFoundError("Dev changes not available");
    }

    const { simpleGit } = await import("simple-git");
    const git = simpleGit(process.cwd());
    const status = await git.status();

    const specFilePattern = /^specs\/([^/]+)\/spec\.md$/;
    const changes: SpecChange[] = [];

    // Collect all changed spec paths from git status
    const allFiles = [
      ...status.not_added.map((f) => ({
        path: f,
        untracked: true,
        deleted: false,
      })),
      ...status.modified.map((f) => ({
        path: f,
        untracked: false,
        deleted: false,
      })),
      ...status.staged.map((f) => ({
        path: f,
        untracked: false,
        deleted: false,
      })),
      ...status.deleted.map((f) => ({
        path: f,
        untracked: false,
        deleted: true,
      })),
      ...status.created.map((f) => ({
        path: f,
        untracked: true,
        deleted: false,
      })),
    ];

    // Deduplicate by path (a file can appear in both modified and staged)
    const seen = new Set<string>();
    for (const file of allFiles) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);

      const match = file.path.match(specFilePattern);
      if (!match) continue;

      const code = match[1];

      if (file.deleted) {
        // Deleted — fetch committed content for title
        try {
          const committed = await git.show(`HEAD:${file.path}`);
          const parsed = parseSpec(committed);
          changes.push({
            code,
            status: "deleted",
            diff: null,
            title: parsed.title,
          });
        } catch (error) {
          logger.warn(
            { code, error },
            "Failed to read committed version of deleted spec",
          );
        }
        continue;
      }

      if (file.untracked) {
        changes.push({ code, status: "new", diff: null });
        continue;
      }

      // Modified/staged — compare committed vs working copy
      try {
        const oldMarkdown = await git.show(`HEAD:${file.path}`);
        const newMarkdown = await readSpecFile(join(process.cwd(), file.path));
        if (!newMarkdown) continue;

        const oldSpec = parseSpec(oldMarkdown);
        const newSpec = parseSpec(newMarkdown);
        const diff = computeStructuredDiff(oldSpec, newSpec);

        if (hasDiffChanges(diff)) {
          changes.push({ code, status: "modified", diff });
        }
      } catch (error) {
        logger.warn(
          { code, error },
          "Failed to read committed version, treating as new",
        );
        changes.push({ code, status: "new", diff: null });
      }
    }

    return changes;
  },
};
