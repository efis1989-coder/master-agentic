import type { Capstone, CapstoneDeliverable, RubricRow } from "./types";
import { fileSlug, parseMarkdownTable } from "./parseUtils";

const LETTER_FROM_SLUG = /^capstone-([abc])\b/i;

/** Pull the capstone letter (A/B/C) from the filename slug. */
function letterFromSlug(slug: string): "A" | "B" | "C" {
  const m = LETTER_FROM_SLUG.exec(slug);
  const l = (m?.[1] ?? "a").toUpperCase();
  return l === "B" ? "B" : l === "C" ? "C" : "A";
}

function titleFromBody(raw: string): string {
  const first = raw.split("\n")[0] ?? "";
  return first.replace(/^#\s*Capstone\s+[A-C]\s*[—-]\s*/i, "").replace(/^#\s*/, "").trim();
}

/**
 * Deliverables are the capstone's numbered work-items, whose heading style differs
 * per capstone: "### N. Title" (A), "## Dossier N — Title" (B), "## Line of attack N — Title" (C).
 */
function parseDeliverables(raw: string, capstoneId: string): CapstoneDeliverable[] {
  const deliverables: CapstoneDeliverable[] = [];
  const re =
    /^#{2,3}\s+(?:(\d+)\.\s+(.*)|Dossier\s+(\d+)\s*[—-]\s*(.*)|Line of attack\s+(\d+)\s*[—-]\s*(.*))$/gim;
  let m: RegExpExecArray | null = re.exec(raw);
  while (m !== null) {
    const index = Number(m[1] ?? m[3] ?? m[5]);
    const rawTitle = (m[2] ?? m[4] ?? m[6] ?? "").trim();
    if (Number.isFinite(index)) {
      // Namespaced per capstone so A/B/C deliverable N don't collide in the exercises store.
      deliverables.push({ id: `${capstoneId}/deliverable/${index}`, index, title: rawTitle });
    }
    m = re.exec(raw);
  }
  return deliverables;
}

/** The rubric is the first markdown table under a "## … rubric …" heading (only Capstone A has one). */
function parseRubric(raw: string): RubricRow[] {
  const start = raw.search(/^##[^\n]*rubric/im);
  if (start === -1) return [];
  const rows = parseMarkdownTable(raw.slice(start));
  return rows.map((cells) => ({
    criterion: (cells[0] ?? "").trim(),
    standard: (cells[1] ?? "").trim(),
  }));
}

/** Parse a capstone-*.md file into a structured, checklist-able Capstone (E11). */
export function parseCapstone(raw: string, path: string): Capstone {
  const slug = fileSlug(path);
  const letter = letterFromSlug(slug);
  const id = `capstone-${letter.toLowerCase()}`;
  return {
    kind: "capstone",
    id,
    slug,
    letter,
    title: titleFromBody(raw),
    bodyMarkdown: raw.trim(),
    deliverables: parseDeliverables(raw, id),
    rubric: parseRubric(raw),
  };
}
