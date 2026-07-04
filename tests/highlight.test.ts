import { describe, expect, it } from "vitest";
import {
  anchorFromOffsets,
  clearHighlights,
  findQuoteOffset,
  paintNote,
  repaintNotes,
} from "../src/features/notes/highlight";

describe("anchorFromOffsets", () => {
  it("captures the quote plus bounded context on each side", () => {
    const text = "the quick brown fox jumps over the lazy dog";
    const a = anchorFromOffsets(text, 10, 15, 4); // "brown"
    expect(a.quote).toBe("brown");
    expect(a.prefix).toBe("ick ");
    expect(a.suffix).toBe(" fox");
  });

  it("clamps context at the string edges", () => {
    const a = anchorFromOffsets("hello world", 0, 5, 8);
    expect(a.quote).toBe("hello");
    expect(a.prefix).toBe("");
    expect(a.suffix).toBe(" world");
  });
});

describe("findQuoteOffset", () => {
  it("returns -1 when the quote is absent (orphaned highlight)", () => {
    expect(findQuoteOffset("abc def", { quote: "xyz", prefix: "", suffix: "" })).toBe(-1);
  });

  it("finds a unique quote outright", () => {
    expect(findQuoteOffset("alpha beta gamma", { quote: "beta", prefix: "", suffix: "" })).toBe(6);
  });

  it("disambiguates repeats by surrounding context", () => {
    const text = "a cat sat. a cat ran.";
    const first = findQuoteOffset(text, { quote: "cat", prefix: "a ", suffix: " sat" });
    const second = findQuoteOffset(text, { quote: "cat", prefix: "a ", suffix: " ran" });
    expect(first).toBe(2);
    expect(second).toBe(13);
  });
});

describe("paintNote / clearHighlights (DOM)", () => {
  it("wraps the matched run in a note-mark and unwraps it cleanly", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>judge the claim and justify it</p>";
    const painted = paintNote(root, {
      id: "n1",
      quote: "claim",
      prefix: "the ",
      suffix: " and",
      color: "green",
    });
    expect(painted).toBe(true);
    const mark = root.querySelector("mark.note-mark");
    expect(mark?.textContent).toBe("claim");
    expect(mark?.getAttribute("data-note-id")).toBe("n1");
    expect(mark?.getAttribute("data-note-color")).toBe("green");

    clearHighlights(root);
    expect(root.querySelector("mark.note-mark")).toBeNull();
    expect(root.textContent).toBe("judge the claim and justify it");
  });

  it("reports false for a quote it cannot locate", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>nothing to see</p>";
    expect(
      paintNote(root, { id: "x", quote: "missing", prefix: "", suffix: "", color: "blue" }),
    ).toBe(false);
  });

  it("repaints multiple notes and is idempotent across runs", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>alpha beta gamma</p>";
    const notes = [
      { id: "a", quote: "alpha", prefix: "", suffix: " beta", color: "yellow" },
      { id: "g", quote: "gamma", prefix: "beta ", suffix: "", color: "pink" },
    ];
    repaintNotes(root, notes);
    repaintNotes(root, notes);
    expect(root.querySelectorAll("mark.note-mark")).toHaveLength(2);
    expect(root.textContent).toBe("alpha beta gamma");
  });
});
