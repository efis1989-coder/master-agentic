import { DOMAIN_IDS, DOMAIN_NAMES, type DomainId, type ThemeTag } from "../../content";
import { deriveThemes } from "../../content/parseUtils";
import type { ProgressRow } from "../../db/types";

/**
 * Minimal chapter/part shapes the dashboard needs. Kept structural (not the full
 * {@link import("../../content").Chapter}) so this module is a pure, cheaply
 * unit-tested function of just ids, parts, domains, and titles.
 */
export interface ChapterMeta {
  id: string;
  part: number;
  domain: DomainId;
  title: string;
}

/**
 * Certification domains map 1:1 to a chapter's {@link ChapterMeta.domain} — except
 * D5 (Security, Governance & Compliance), which the curriculum treats as a
 * cross-cutting spiral theme rather than a dedicated Part, so no chapter carries
 * `domain: "D5"`. Fall its meter back to the chapters whose *title* names the theme
 * — the deliberate "spiral passes" (guardrails, security & identity, compliance &
 * governance) — so reading that core still advances the D5 domain toward exam
 * readiness. Title-scoped (not body-scoped) on purpose: nearly every chapter
 * *mentions* security, but only the dedicated ones are titled for it.
 */
const DOMAIN_THEME_FALLBACK: Partial<Record<DomainId, ThemeTag>> = {
  D5: "security",
};

/** True when a chapter's title names the given spiral theme (reuses the shared patterns). */
function titleHasTheme(title: string, theme: ThemeTag): boolean {
  return deriveThemes(title, "").includes(theme);
}

export interface PartMeta {
  part: number;
  name: string;
  chapters: ChapterMeta[];
}

/** A single labelled meter: `read` of `total` chapters complete. */
export interface ProgressBarData {
  key: string;
  label: string;
  read: number;
  total: number;
  pct: number; // 0..1
}

export interface ProgressStats {
  chaptersRead: number; // status "read"
  chaptersStarted: number; // opened but not finished (status "reading")
  totalChapters: number;
  overallPct: number; // 0..1
  byPart: ProgressBarData[];
  byDomain: ProgressBarData[]; // always all six domains (D1..D6), in order
}

function fraction(read: number, total: number): number {
  return total === 0 ? 0 : read / total;
}

function meter(
  key: string,
  label: string,
  chapters: readonly ChapterMeta[],
  isRead: (id: string) => boolean,
): ProgressBarData {
  const total = chapters.length;
  const read = chapters.reduce((n, c) => (isRead(c.id) ? n + 1 : n), 0);
  return { key, label, read, total, pct: fraction(read, total) };
}

/**
 * Reduce raw per-chapter {@link ProgressRow}s into the dashboard model: overall
 * completion, per-Part bars, and the six certification-domain meters. A chapter
 * counts as read only at status "read"; "reading" is surfaced separately as
 * in-progress. Domain meters are reading-coverage today and gain self-test/exam
 * accuracy when those milestones land.
 */
export function computeProgressStats(
  rows: readonly ProgressRow[],
  chapters: readonly ChapterMeta[],
  parts: readonly PartMeta[],
): ProgressStats {
  const status = new Map(rows.map((r) => [r.id, r.status]));
  const isRead = (id: string): boolean => status.get(id) === "read";

  const chaptersRead = chapters.reduce((n, c) => (isRead(c.id) ? n + 1 : n), 0);
  const chaptersStarted = chapters.reduce(
    (n, c) => (status.get(c.id) === "reading" ? n + 1 : n),
    0,
  );

  const byPart = parts.map((p) =>
    meter(`part-${p.part}`, `Part ${p.part} · ${p.name}`, p.chapters, isRead),
  );

  const byDomain = DOMAIN_IDS.map((d) => {
    const theme = DOMAIN_THEME_FALLBACK[d];
    const domainChapters = chapters.filter(
      (c) => c.domain === d || (theme !== undefined && titleHasTheme(c.title, theme)),
    );
    return meter(d, `${d} · ${DOMAIN_NAMES[d]}`, domainChapters, isRead);
  });

  return {
    chaptersRead,
    chaptersStarted,
    totalChapters: chapters.length,
    overallPct: fraction(chaptersRead, chapters.length),
    byPart,
    byDomain,
  };
}
