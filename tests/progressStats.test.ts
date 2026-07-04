import { describe, expect, it } from "vitest";
import type { DomainId } from "../src/content";
import type { ProgressRow } from "../src/db/types";
import {
  type ChapterMeta,
  type PartMeta,
  computeProgressStats,
} from "../src/features/progress/stats";

function ch(id: string, part: number, domain: DomainId, title = ""): ChapterMeta {
  return { id, part, domain, title };
}

function row(id: string, status: ProgressRow["status"]): ProgressRow {
  return { id, status, scrollPct: status === "read" ? 1 : 0.3, updatedAt: 1 };
}

const chapters: ChapterMeta[] = [
  ch("ch-0-1", 0, "D1"),
  ch("ch-0-2", 0, "D1"),
  ch("ch-1-1", 1, "D2"),
  ch("ch-1-2", 1, "D3"),
];

const parts: PartMeta[] = [
  { part: 0, name: "Orientation", chapters: [chapters[0], chapters[1]] },
  { part: 1, name: "Building", chapters: [chapters[2], chapters[3]] },
];

describe("computeProgressStats", () => {
  it("reports zero everywhere with no progress rows", () => {
    const stats = computeProgressStats([], chapters, parts);
    expect(stats.chaptersRead).toBe(0);
    expect(stats.chaptersStarted).toBe(0);
    expect(stats.overallPct).toBe(0);
    expect(stats.byPart.every((b) => b.pct === 0)).toBe(true);
  });

  it("counts only status 'read' toward completion; 'reading' is in-progress", () => {
    const stats = computeProgressStats(
      [row("ch-0-1", "read"), row("ch-0-2", "read"), row("ch-1-1", "reading")],
      chapters,
      parts,
    );
    expect(stats.chaptersRead).toBe(2);
    expect(stats.chaptersStarted).toBe(1);
    expect(stats.totalChapters).toBe(4);
    expect(stats.overallPct).toBeCloseTo(0.5);
  });

  it("computes per-part bars", () => {
    const stats = computeProgressStats([row("ch-0-1", "read")], chapters, parts);
    const part0 = stats.byPart.find((b) => b.key === "part-0");
    const part1 = stats.byPart.find((b) => b.key === "part-1");
    expect(part0).toMatchObject({ read: 1, total: 2 });
    expect(part0?.pct).toBeCloseTo(0.5);
    expect(part1).toMatchObject({ read: 0, total: 2, pct: 0 });
  });

  it("always emits all six domains in order, with unpopulated ones at 0/0", () => {
    const stats = computeProgressStats([row("ch-0-1", "read")], chapters, parts);
    expect(stats.byDomain.map((b) => b.key)).toEqual(["D1", "D2", "D3", "D4", "D5", "D6"]);
    const d1 = stats.byDomain.find((b) => b.key === "D1");
    const d4 = stats.byDomain.find((b) => b.key === "D4");
    expect(d1).toMatchObject({ read: 1, total: 2 });
    expect(d4).toMatchObject({ read: 0, total: 0, pct: 0 });
  });

  it("fills the D5 meter from security-titled chapters, since no chapter is domain D5", () => {
    // Security is a cross-cutting spiral theme: the dedicated chapters live in
    // other domains (D3 guardrails/identity, D4 compliance) but are titled for it.
    // A chapter that merely mentions security in its body must NOT count.
    const themed: ChapterMeta[] = [
      ch("ch-3-4", 3, "D3", "Guardrails, Sandboxing & Blast-Radius Containment"),
      ch("ch-3-5", 3, "D3", "Security & Identity for Agentic Systems"),
      ch("ch-4-7", 4, "D4", "Compliance, Audit & Governance"),
      ch("ch-1-1", 1, "D2", "Tool Design & Function Calling"),
    ];
    const stats = computeProgressStats([row("ch-3-4", "read"), row("ch-3-5", "read")], themed, []);
    const d5 = stats.byDomain.find((b) => b.key === "D5");
    expect(d5).toMatchObject({ read: 2, total: 3 });
    expect(d5?.pct).toBeCloseTo(2 / 3);
  });
});
