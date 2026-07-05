import type { ChapterSection, DomainId, GlossaryTerm, ThemeTag } from "./types";

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

/**
 * Strip inline markdown emphasis markers (`**bold**`, `*italic*`) from anywhere
 * in a string, keeping the emphasized text. Unlike `stripEmphasis` (which only
 * peels a single wrapping pair), this cleans mid-string emphasis — used for
 * doctrine / doctrine-check text that is rendered as plain text, so residual
 * markers would otherwise display literally.
 */
export function stripInlineEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
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
  evals: /\b(eval|evaluat|judge|grader|observab|tracing|reliab)/gi,
  security: /\b(security|identity|guardrail|sandbox|blast[- ]radius|injection|compliance|audit|governance)/gi,
  cost: /\b(cost|latency|budget|econom|token[- ]spend|unit[- ]economics)/gi,
  state: /\b(state|memory|durable|persist|context[- ]engineering|long[- ]horizon)/gi,
};

/**
 * Minimum keyword-occurrence count required to tag a chapter with a theme.
 * Generic single-word patterns (e.g. "state", "cost", "audit") appear
 * incidentally almost everywhere, so a simple presence test tags nearly every
 * chapter with nearly every theme. These thresholds were derived from an
 * occurrence-count matrix across all 32 chapters: genuine on-topic chapters
 * cluster an order of magnitude above incidental mentions.
 */
const THEME_THRESHOLDS: Record<ThemeTag, number> = {
  evals: 20,
  security: 10,
  cost: 15,
  state: 15,
};

/**
 * True when a chapter *title* alone names the given theme. Titles are short, so
 * this is a plain presence test (not the occurrence-count threshold `deriveThemes`
 * applies to full chapter bodies) — a title only ever mentions a theme once, but
 * that one mention is deliberate rather than incidental the way body mentions are.
 */
export function titleNamesTheme(title: string, theme: ThemeTag): boolean {
  return new RegExp(THEME_PATTERNS[theme].source, "i").test(title);
}

/** E10 — derive spiral theme tags from the chapter title + body keywords. */
export function deriveThemes(title: string, body: string): ThemeTag[] {
  const haystack = `${title}\n${body}`;
  const themes: ThemeTag[] = [];
  for (const [theme, re] of Object.entries(THEME_PATTERNS) as [ThemeTag, RegExp][]) {
    const count = haystack.match(re)?.length ?? 0;
    if (count >= THEME_THRESHOLDS[theme]) themes.push(theme);
  }
  return themes;
}

const LIST_ITEM_RE = /^\s*(?:[-*]|\d+[.)])\s/;
const BLOCKQUOTE_PREFIX_RE = /^(?:>\s*)+/;
const STANDALONE_BOLD_RE = /^\*\*[^*].*\*\*$/;
const INLINE_BOLD_RE = /\*\*([^*]{2,40})\*\*/g;
const LEADING_SYMBOLS_RE = /^[^\p{L}\p{N}]+/u;
const STARTS_WITH_NUMBER_RE = /^[\d$]/;
const MAX_TERM_WORDS = 4;

/**
 * True when a captured bold span reads as a glossary term rather than a bolded
 * statistic or a clause/sentence used for emphasis. Excludes spans starting with
 * a digit or currency figure (stats like "36%", "97% per-step reliability", "$1.4M"),
 * spans containing a comma (clause fragments like "Override rate, segmented and
 * audited"), and spans longer than a few words (full-sentence emphasis). Leading
 * symbols are stripped before the numeric test so a bounded figure like
 * "≤12 agent-facing tools" is still recognised as a stat, not a term.
 */
function looksLikeTerm(text: string): boolean {
  if (STARTS_WITH_NUMBER_RE.test(text.replace(LEADING_SYMBOLS_RE, ""))) return false;
  if (text.includes(",")) return false;
  if (text.split(/\s+/).length > MAX_TERM_WORDS) return false;
  return true;
}

/**
 * E-glossary — extract key terms introduced inline in a chapter's prose, tagged
 * with the section they first appear in. Skips markdown-table rows and list-item
 * headers (bold spans there are labels, not defined terms) and skips standalone
 * bold doctrine sentences (mirrors the exclusion `parseDoctrine` already applies),
 * since bolding a whole sentence is emphasis, not a term definition. Leading
 * blockquote markers ("> ") are stripped first, so a doctrine sentence quoted in a
 * callout is still recognised as standalone emphasis. A run-in bold label that opens
 * a *blockquote* callout and ends in a period (the "**Doctrine check.** …" lead every
 * chapter carries) is likewise treated as an emphasis lead, not a term — while
 * plain-paragraph lead-in labels (e.g. "Distribution shift.") are still captured, with
 * their trailing period stripped. Also skips spans that don't `looksLikeTerm` (stats,
 * clause fragments, long emphasis spans). De-duplicates case-insensitively within the
 * chapter, keeping the first section a term appears in.
 */
export function extractGlossaryTerms(sections: ChapterSection[]): GlossaryTerm[] {
  const seen = new Set<string>();
  const terms: GlossaryTerm[] = [];
  for (const section of sections) {
    for (const rawLine of section.markdown.split("\n")) {
      const trimmed = rawLine.trim();
      const isBlockquote = BLOCKQUOTE_PREFIX_RE.test(trimmed);
      const line = trimmed.replace(BLOCKQUOTE_PREFIX_RE, "");
      if (!line || line.startsWith("|") || LIST_ITEM_RE.test(line) || STANDALONE_BOLD_RE.test(line)) {
        continue;
      }
      for (const m of line.matchAll(INLINE_BOLD_RE)) {
        const raw = (m[1] ?? "").trim();
        // A bold span that opens a blockquote callout and ends in a period is a
        // run-in label (e.g. "**Doctrine check.**"), not a defined term.
        if (isBlockquote && m.index === 0 && raw.endsWith(".")) continue;
        const term = raw.replace(/\.$/, "");
        if (!term || !looksLikeTerm(term)) continue;
        const key = term.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        terms.push({ term, sectionN: section.n });
      }
    }
  }
  return terms;
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
