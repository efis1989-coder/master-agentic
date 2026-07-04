import { DOMAIN_NAMES } from "../../content";
import type { Chapter } from "../../content";

/** One searchable chapter, pre-lowercased so matching is a simple substring scan. */
interface IndexEntry {
  id: string;
  number: string;
  title: string;
  partName: string;
  /** High-weight haystack: chapter number, title, part, domain name. */
  titleHay: string;
  /** Low-weight haystack: section titles + collapsed body prose. */
  bodyHay: string;
  /** Original-case body used to cut readable snippets around a hit. */
  bodyText: string;
}

/** A ranked hit surfaced by {@link searchChapters}. */
export interface SearchHit {
  id: string;
  number: string;
  title: string;
  partName: string;
  /** Short excerpt around the first body match, or the title when only that hit. */
  snippet: string;
}

/**
 * Strip Markdown noise (fences, links, emphasis, headings) down to prose so the
 * body haystack and snippets read as plain text rather than syntax.
 */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/[#>*_~|-]+/g, " ") // heading/emphasis/table marks
    .replace(/\s+/g, " ")
    .trim();
}

/** Build the in-memory index once; cheap enough to run at module load. */
export function buildSearchIndex(chapters: Chapter[]): IndexEntry[] {
  return chapters.map((ch) => {
    const bodyText = ch.sections.map((s) => `${s.title}. ${toPlainText(s.markdown)}`).join(" ");
    const titleHay =
      `${ch.number} ${ch.title} ${ch.partName} ${DOMAIN_NAMES[ch.domain]}`.toLowerCase();
    return {
      id: ch.id,
      number: ch.number,
      title: ch.title,
      partName: ch.partName,
      titleHay,
      bodyHay: bodyText.toLowerCase(),
      bodyText,
    };
  });
}

/** Split a query into distinct, non-empty, lowercased terms. */
function terms(query: string): string[] {
  return Array.from(new Set(query.toLowerCase().split(/\s+/).filter(Boolean)));
}

/** Cut a ~140-char window centred on the first term hit in the body. */
function snippetAround(bodyText: string, term: string): string {
  const lower = bodyText.toLowerCase();
  const at = lower.indexOf(term);
  if (at < 0) return bodyText.slice(0, 140).trim();
  const start = Math.max(0, at - 60);
  const end = Math.min(bodyText.length, at + term.length + 80);
  const core = bodyText.slice(start, end).trim();
  return `${start > 0 ? "… " : ""}${core}${end < bodyText.length ? " …" : ""}`;
}

/**
 * Rank chapters against a query with AND semantics: every term must appear in a
 * chapter's title or body. Title hits weigh more than body hits, and a leading
 * title match (prefix of the number/title haystack) floats to the very top so
 * typing "0.1" or "agentic" lands the obvious chapter first.
 */
export function searchChapters(index: IndexEntry[], query: string, limit = 8): SearchHit[] {
  const qs = terms(query);
  if (qs.length === 0) return [];

  const scored: { entry: IndexEntry; score: number; hitTerm: string | null }[] = [];
  for (const entry of index) {
    let score = 0;
    let hitTerm: string | null = null;
    let matchedAll = true;

    for (const t of qs) {
      const inTitle = entry.titleHay.includes(t);
      const inBody = entry.bodyHay.includes(t);
      if (!inTitle && !inBody) {
        matchedAll = false;
        break;
      }
      if (inTitle) {
        score += entry.titleHay.startsWith(t) ? 12 : 6;
      }
      if (inBody) {
        score += 1;
        if (hitTerm === null) hitTerm = t;
      }
    }

    if (matchedAll) scored.push({ entry, score, hitTerm });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.number.localeCompare(b.entry.number));

  return scored.slice(0, limit).map(({ entry, hitTerm }) => ({
    id: entry.id,
    number: entry.number,
    title: entry.title,
    partName: entry.partName,
    snippet: hitTerm ? snippetAround(entry.bodyText, hitTerm) : entry.title,
  }));
}
