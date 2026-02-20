import type { Content, Heading, List, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import type {
  AcceptanceScenario,
  KeyDecision,
  KeyEntity,
  ParsedSpec,
  UserStory,
} from "./model";

function textContent(node: Content): string {
  if (node.type === "text") return node.value;
  if ("children" in node)
    return (node.children as Content[]).map(textContent).join("");
  return "";
}

function extractScenarios(list: List): AcceptanceScenario[] {
  return list.children.map((item) => {
    const raw = (item.children as Content[]).map(textContent).join("").trim();
    const idMatch = raw.match(/^(US[\d.]+|CC\d+)/);
    const id = idMatch ? idMatch[1] : "";
    const edge = raw.includes("[edge]");
    // Strip the ID, bold markers, dashes, and [edge] tag to get the scenario text
    const text = raw
      .replace(/^\*{0,2}(US[\d.]+|CC\d+)\*{0,2}\s*/, "")
      .replace(/\[edge\]\s*/, "")
      .replace(/^—\s*/, "")
      .trim();
    return { id, text, edge };
  });
}

function extractBoldPrefixedText(
  nodes: Content[],
  startIdx: number,
  prefix: string,
): { value: string; nextIdx: number } {
  for (let i = startIdx; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "paragraph") {
      const full = textContent(node);
      if (full.startsWith(prefix)) {
        return {
          value: full.slice(prefix.length).replace(/^:\s*/, "").trim(),
          nextIdx: i + 1,
        };
      }
    }
  }
  return { value: "", nextIdx: startIdx };
}

function parseUserStory(
  heading: Heading,
  sectionNodes: Content[],
): UserStory | null {
  const headingText = textContent(heading as unknown as Content);
  const match = headingText.match(
    /User Story (\d+)\s*-\s*(.+?)\s*\(Priority:\s*(P\d+)\)/,
  );
  if (!match) return null;

  const [, numStr, title, priority] = match;
  const description = sectionNodes
    .filter(
      (n) =>
        n.type === "paragraph" &&
        !textContent(n).startsWith("Why this priority") &&
        !textContent(n).startsWith("Independent Test") &&
        !textContent(n).startsWith("Acceptance Scenarios") &&
        !textContent(n).startsWith("Note"),
    )
    .map(textContent)
    .filter((t) => !t.startsWith("**"))
    .join("\n")
    .trim();

  const { value: whyPriority } = extractBoldPrefixedText(
    sectionNodes,
    0,
    "Why this priority",
  );
  const { value: independentTest } = extractBoldPrefixedText(
    sectionNodes,
    0,
    "Independent Test",
  );

  const listNode = sectionNodes.find(
    (n) => n.type === "list" && n.ordered === true,
  ) as List | undefined;
  const acceptanceScenarios = listNode ? extractScenarios(listNode) : [];

  return {
    number: Number.parseInt(numStr, 10),
    title,
    priority,
    description,
    whyPriority,
    independentTest,
    acceptanceScenarios,
  };
}

function extractEntities(list: List): KeyEntity[] {
  return list.children.map((item) => {
    const raw = (item.children as Content[]).map(textContent).join("").trim();
    const colonIdx = raw.indexOf(":");
    if (colonIdx === -1) return { name: raw, description: "" };
    return {
      name: raw.slice(0, colonIdx).trim(),
      description: raw.slice(colonIdx + 1).trim(),
    };
  });
}

function extractDecisions(list: List): KeyDecision[] {
  return list.children.map((item) => {
    const raw = (item.children as Content[]).map(textContent).join("").trim();
    const colonIdx = raw.indexOf(":");
    if (colonIdx === -1) return { choice: raw, reasoning: "" };
    return {
      choice: raw.slice(0, colonIdx).trim(),
      reasoning: raw.slice(colonIdx + 1).trim(),
    };
  });
}

export function parseSpec(markdown: string): ParsedSpec {
  const tree: Root = fromMarkdown(markdown);
  const nodes = tree.children as Content[];

  // Extract feature code and title from H1
  let featureCode = "";
  let title = "";
  const h1 = nodes.find((n) => n.type === "heading" && n.depth === 1) as
    | Heading
    | undefined;
  if (h1) {
    const h1Text = textContent(h1 as unknown as Content);
    const titleMatch = h1Text.match(
      /Feature Specification:\s*(.+?)\s*\((\w+)\)/,
    );
    if (titleMatch) {
      title = titleMatch[1].trim();
      featureCode = titleMatch[2];
    }
  }

  // Fallback: extract feature code from **Feature Code** paragraph
  if (!featureCode) {
    for (const node of nodes) {
      if (node.type === "paragraph") {
        const text = textContent(node);
        const codeMatch = text.match(/Feature Code:\s*(\w+)/);
        if (codeMatch) {
          featureCode = codeMatch[1];
          break;
        }
      }
    }
  }

  const userStories: UserStory[] = [];
  let crossCuttingConcerns: AcceptanceScenario[] = [];
  let keyEntities: KeyEntity[] = [];
  let keyDecisions: KeyDecision[] = [];

  // Walk through nodes, collecting sections under each heading
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== "heading") continue;

    // Collect all nodes until the next heading of equal or higher depth
    const sectionNodes: Content[] = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const next = nodes[j];
      if (next.type === "heading" && next.depth <= node.depth) break;
      sectionNodes.push(next);
    }

    const headingText = textContent(node as unknown as Content);

    if (node.depth === 3 && headingText.includes("User Story")) {
      const story = parseUserStory(node, sectionNodes);
      if (story) userStories.push(story);
    } else if (node.depth === 3 && headingText.includes("Cross-Cutting")) {
      const listNode = sectionNodes.find(
        (n) => n.type === "list" && n.ordered === true,
      ) as List | undefined;
      if (listNode) crossCuttingConcerns = extractScenarios(listNode);
    } else if (node.depth === 2 && headingText.includes("Key Entities")) {
      const listNode = sectionNodes.find((n) => n.type === "list") as
        | List
        | undefined;
      if (listNode) keyEntities = extractEntities(listNode);
    } else if (node.depth === 2 && headingText.includes("Key Decisions")) {
      const listNode = sectionNodes.find((n) => n.type === "list") as
        | List
        | undefined;
      if (listNode) keyDecisions = extractDecisions(listNode);
    }
  }

  return {
    featureCode,
    title,
    userStories,
    crossCuttingConcerns,
    keyEntities,
    keyDecisions,
  };
}
