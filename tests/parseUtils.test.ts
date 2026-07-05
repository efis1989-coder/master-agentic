import { describe, expect, it } from "vitest";
import { extractGlossaryTerms, stripInlineEmphasis } from "../src/content/parseUtils";
import type { ChapterSection } from "../src/content/types";

function section(markdown: string, n = 1): ChapterSection {
  return { n, title: "Section", markdown };
}

describe("extractGlossaryTerms", () => {
  it("extracts a term introduced inline mid-sentence", () => {
    const terms = extractGlossaryTerms([
      section("A **workflow** is a system that follows a fixed sequence of steps."),
    ]);
    expect(terms).toEqual([{ term: "workflow", sectionN: 1 }]);
  });

  it("skips bold spans inside markdown table rows", () => {
    const terms = extractGlossaryTerms([
      section("| **Agent-washing** | Marketing agentic capability that isn't there |"),
    ]);
    expect(terms).toEqual([]);
  });

  it("skips bold spans that lead a list item", () => {
    const terms = extractGlossaryTerms([
      section("1. **Invoice matching** for accounts payable workflows."),
    ]);
    expect(terms).toEqual([]);
  });

  it("skips a standalone bold doctrine-style line", () => {
    const terms = extractGlossaryTerms([
      section("**Agents should be trusted no more than the sandbox that contains them.**"),
    ]);
    expect(terms).toEqual([]);
  });

  it("de-duplicates a repeated term within a chapter, keeping the first section", () => {
    const terms = extractGlossaryTerms([
      section("A **tool call** is how a model invokes external capability.", 2),
      section("Every **tool call** is logged for audit.", 4),
    ]);
    expect(terms).toEqual([{ term: "tool call", sectionN: 2 }]);
  });

  it("skips a blockquoted doctrine-check run-in label (B1)", () => {
    const terms = extractGlossaryTerms([
      section("> **Doctrine check.** At every spectrum position, ask where the core sits.", 3),
    ]);
    expect(terms).toEqual([]);
  });

  it("still captures a plain-paragraph lead-in label, stripping its trailing period (B1)", () => {
    // Non-blockquote lead-in labels are genuine terms; only blockquote run-in
    // labels ("Doctrine check.") are dropped. This guards against an
    // over-broad B1 rule that would strip every period-ending bold lead.
    const terms = extractGlossaryTerms([
      section("**Distribution shift.** The traffic your agent sees drifts over time.", 2),
    ]);
    expect(terms).toEqual([{ term: "Distribution shift", sectionN: 2 }]);
  });

  it("still captures a sentence-initial term whose period falls outside the bold (B1)", () => {
    const terms = extractGlossaryTerms([
      section("**Idempotency keys** make an effect safe to retry.", 2),
    ]);
    expect(terms).toEqual([{ term: "Idempotency keys", sectionN: 2 }]);
  });

  it("skips a numeric lead masked by a leading symbol (B2)", () => {
    const terms = extractGlossaryTerms([
      section("Redesign this into **≤12 agent-facing tools** for the CRM.", 6),
    ]);
    expect(terms).toEqual([]);
  });
});

describe("stripInlineEmphasis", () => {
  it("removes mid-string italic markers, keeping the text", () => {
    expect(stripInlineEmphasis("integrity lives entirely in the *label*.")).toBe(
      "integrity lives entirely in the label.",
    );
  });

  it("removes mid-string bold markers, keeping the text", () => {
    expect(stripInlineEmphasis("put a **validator at the seam** between systems.")).toBe(
      "put a validator at the seam between systems.",
    );
  });

  it("removes multiple emphasis spans in one string", () => {
    expect(stripInlineEmphasis("the *judge* inherits the **judge's biases** here.")).toBe(
      "the judge inherits the judge's biases here.",
    );
  });

  it("leaves text without emphasis untouched", () => {
    expect(stripInlineEmphasis("plain doctrine sentence with no markers")).toBe(
      "plain doctrine sentence with no markers",
    );
  });
});
