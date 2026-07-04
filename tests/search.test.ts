import { describe, expect, it } from "vitest";
import type { Chapter } from "../src/content";
import { buildSearchIndex, searchChapters } from "../src/features/search/searchIndex";

// Two hand-built chapters exercise the ranking rules without dragging the whole
// parsed course in: one names "evaluations" in the title, the other only in the
// prose, so title-vs-body weighting and AND semantics are both observable.
function chapter(over: Partial<Chapter>): Chapter {
  return {
    id: "ch-0-1",
    number: "0.1",
    title: "The Agentic Spectrum",
    part: 0,
    partName: "Part 0 · Foundations",
    chapterIndex: 1,
    domain: "D1",
    readingTimeMin: 20,
    prerequisites: [],
    themes: [],
    sections: [{ n: 1, title: "Intro", markdown: "A plain paragraph about agents." }],
    bodyMarkdown: "",
    incident: "",
    doctrine: "",
    doctrineCheck: "",
    selfTest: [],
    srsCards: [],
    exercise: null,
    ...over,
  } as Chapter;
}

const chapters: Chapter[] = [
  chapter({
    id: "ch-2-3",
    number: "2.3",
    title: "Designing Evaluations",
    sections: [{ n: 1, title: "Why", markdown: "Ship gates rely on tests." }],
  }),
  chapter({
    id: "ch-0-1",
    number: "0.1",
    title: "The Agentic Spectrum",
    sections: [
      { n: 1, title: "Intro", markdown: "Later chapters return to evaluations repeatedly." },
    ],
  }),
];

const index = buildSearchIndex(chapters);

describe("searchChapters", () => {
  it("ranks a title match above a body-only match", () => {
    const hits = searchChapters(index, "evaluations");
    expect(hits.map((h) => h.id)).toEqual(["ch-2-3", "ch-0-1"]);
  });

  it("finds a chapter by its number", () => {
    const hits = searchChapters(index, "0.1");
    expect(hits[0]?.id).toBe("ch-0-1");
  });

  it("uses AND semantics across terms", () => {
    // "designing" is only in ch-2-3; "spectrum" is only in ch-0-1 — no chapter has both.
    expect(searchChapters(index, "designing spectrum")).toHaveLength(0);
    // Both terms live in ch-2-3's title.
    expect(searchChapters(index, "designing evaluations").map((h) => h.id)).toEqual(["ch-2-3"]);
  });

  it("returns a body snippet containing the matched term", () => {
    const hits = searchChapters(index, "repeatedly");
    expect(hits[0]?.id).toBe("ch-0-1");
    expect(hits[0]?.snippet.toLowerCase()).toContain("repeatedly");
  });

  it("returns nothing for an empty query", () => {
    expect(searchChapters(index, "   ")).toHaveLength(0);
  });
});
