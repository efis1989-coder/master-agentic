import { course } from "../content";

/**
 * Minimal hast node shapes we touch. react-markdown feeds a full hast tree; we
 * only need to walk elements and rewrite text nodes, so these partial types keep
 * us off `any` without pulling in `@types/hast`.
 */
interface HastText {
  type: "text";
  value: string;
}
interface HastElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}
interface HastRoot {
  type: "root";
  children: HastNode[];
}
type HastNode = HastText | HastElement | HastRoot | { type: string; children?: HastNode[] };

// Valid targets so a stray "Ch. 9.9" is left as plain text rather than linking
// to a dead route. number "0.1" → id "ch-0-1".
const CHAPTER_IDS = new Set(course.chapters.map((c) => c.id));
const REF = /Ch\.\s*(\d+)\.(\d+)/g;

/** Elements whose text must stay literal (code samples, existing links). */
const SKIP = new Set(["a", "code", "pre"]);

function linkNode(label: string, id: string): HastElement {
  return {
    type: "element",
    tagName: "a",
    properties: { href: `#/read/${id}`, className: ["chapter-xref"] },
    children: [{ type: "text", value: label }],
  };
}

/** Replace "Ch. X.Y" runs in one text value with a mix of text + anchor nodes. */
function splitText(value: string): HastNode[] | null {
  REF.lastIndex = 0;
  let match = REF.exec(value);
  if (match === null) return null;

  const out: HastNode[] = [];
  let last = 0;
  while (match !== null) {
    const [full, part, idx] = match;
    const id = `ch-${part}-${idx}`;
    if (CHAPTER_IDS.has(id)) {
      if (match.index > last) out.push({ type: "text", value: value.slice(last, match.index) });
      out.push(linkNode(full, id));
      last = match.index + full.length;
    }
    match = REF.exec(value);
  }
  if (out.length === 0) return null;
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out;
}

function walk(node: HastNode): void {
  if (!("children" in node) || !node.children) return;
  const next: HastNode[] = [];
  for (const child of node.children) {
    if (child.type === "text") {
      const replaced = splitText((child as HastText).value);
      if (replaced) {
        next.push(...replaced);
        continue;
      }
    } else if (child.type === "element" && !SKIP.has((child as HastElement).tagName)) {
      walk(child);
    }
    next.push(child);
  }
  node.children = next;
}

/**
 * rehype plugin: turn in-prose "Ch. X.Y" references into HashRouter links to the
 * target chapter, skipping code and existing anchors. Unknown chapters are left
 * untouched.
 */
export function rehypeChapterLinks() {
  return (tree: HastRoot): void => {
    walk(tree);
  };
}
