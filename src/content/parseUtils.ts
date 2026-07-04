import type { ChapterSection, DomainId, ThemeTag } from "./types";

/** Strip surrounding markdown emphasis (`*`, `**`) and trim. */
export function stripEmphasis(text: string): string {
  let t = text.trim();
  // Remove a single wrapping pair of ** or *.
  const pairs: [string, string][] = [
    ["**", "**"],
    ["*", "*"],
  ];
  for (const [open, close] of pairs) {
    if (t.startsWith(open) && t.endsWith(close) && t.length > open.length + close.length) {
      t = t.slice(open.length, t.length - close.length).trim();
      break;
    }
  }
  return t;
}

/** Strip wrapping straight or curly double quotes. */
export function stripQuotes(text: string): string {
  const t = text.trim();
  const first = t[0];
  const last = t[t.length - 1];
  const openers = new Set(['"', "\u201c"]);
  const closers = new Set(['"', "\u201d"]);
  if (t.length >= 2 && openers.has(first ?? "") && closers.has(last ?? "")) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/** Filename (no extension) → id slug, e.g. "chapter-0-1-agentic-spectrum". */
export function fileSlug(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.md$/i, "");
}

/**
 * Split a chapter body into its "## N. Title" sections. Content before the first
 * numbered heading is ignored (metadata/intro). A trailing "---" / "*Next: …*"
 * closer is left attached to the final section's markdown; callers that need the
 * clean section body slice on "---" themselves.
 */
export function splitSections(body: string): ChapterSection[] {
  const lines = body.split("\n");
  const headingRe = /^##\s+(\d+)\.\s+(.*)$/;
  const sections: ChapterSection[] = [];
  let current: ChapterSection | null = null;

  for (const line of lines) {
    const m = headingRe.exec(line);
    if (m) {
      if (current) sections.push(current);
      current = { n: Number(m[1]), title: (m[2] ?? "").trim(), markdown: "" };
    } else if (current) {
      current.markdown += (current.markdown ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  for (const s of sections) s.markdown = s.markdown.trim();
  return sections;
}

export function findSection(sections: ChapterSection[], n: number): ChapterSection | null {
  return sections.find((s) => s.n === n) ?? null;
}

/** Cut off a section body at a horizontal rule ("---") — used to drop the "*Next:*" closer. */
export function beforeHorizontalRule(markdown: string): string {
  const idx = markdown.search(/^\s*---\s*$/m);
  return idx === -1 ? markdown : markdown.slice(0, idx).trim();
}

const THEME_PATTERNS: Record<ThemeTag, RegExp> = {
  evals: /\b(eval|evaluat|judge|grader|observab|tracing|reliab)/i,
  security: /\b(security|identity|guardrail|sandbox|blast[- ]radius|injection|compliance|audit|governance)/i,
  cost: /\b(cost|latency|budget|econom|token[- ]spend|unit[- ]economics)/i,
  state: /\b(state|memory|durable|persist|context[- ]engineering|long[- ]horizon)/i,
};

/** E10 — derive spiral theme tags from the chapter title + body keywords. */
export function deriveThemes(title: string, body: string): ThemeTag[] {
  const haystack = `${title}\n${body}`;
  const themes: ThemeTag[] = [];
  for (const [theme, re] of Object.entries(THEME_PATTERNS) as [ThemeTag, RegExp][]) {
    if (re.test(haystack)) themes.push(theme);
  }
  return themes;
}

/** Parse a GitHub-flavored markdown table into rows of cell arrays (header excluded). */
export function parseMarkdownTable(markdown: string): string[][] {
  const rows: string[][] = [];
  const lines = markdown.split("\n");
  let inTable = false;
  let headerSeen = false;
  for (const raw of lines) {
    const line = raw.trim();
    const isRow = line.startsWith("|") && line.endsWith("|") && line.length > 1;
    if (!isRow) {
      if (inTable) break; // table ended
      continue;
    }
    inTable = true;
    const cells = line
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());
    const isSeparator = cells.every((c) => /^:?-{2,}:?$/.test(c) || c === "");
    if (isSeparator) {
      headerSeen = true;
      continue;
    }
    if (!headerSeen) continue; // skip header row until separator seen
    rows.push(cells);
  }
  return rows;
}

export const DOMAIN_IDS: DomainId[] = ["D1", "D2", "D3", "D4", "D5", "D6"];

export function isDomainId(value: string): value is DomainId {
  return (DOMAIN_IDS as string[]).includes(value);
}
