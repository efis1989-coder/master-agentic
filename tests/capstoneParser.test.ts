import { describe, expect, it } from "vitest";
import { course } from "./fixtures";

describe("capstone parsing", () => {
  it("parses exactly 3 capstones (A, B, C)", () => {
    expect(course.capstones).toHaveLength(3);
    expect(course.capstones.map((c) => c.letter)).toEqual(["A", "B", "C"]);
  });

  it("gives every capstone a title, id, and at least one deliverable", () => {
    for (const cap of course.capstones) {
      expect(cap.id).toMatch(/^capstone-[abc]$/);
      expect(cap.title.length).toBeGreaterThan(0);
      expect(cap.deliverables.length).toBeGreaterThanOrEqual(1);
      cap.deliverables.forEach((d, i) => {
        expect(d.index).toBe(i + 1);
        expect(d.title.length).toBeGreaterThan(0);
        // Namespaced per capstone so A/B/C deliverable N don't collide in the exercises store.
        expect(d.id).toBe(`${cap.id}/deliverable/${d.index}`);
      });
    }
  });

  it("gives deliverables globally-unique ids across capstones", () => {
    const ids = course.capstones.flatMap((c) => c.deliverables.map((d) => d.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("extracts the rubric table for capstone A", () => {
    const a = course.capstones.find((c) => c.letter === "A");
    expect(a?.rubric.length).toBeGreaterThanOrEqual(1);
    for (const row of a?.rubric ?? []) {
      expect(row.criterion.length).toBeGreaterThan(0);
    }
  });
});

describe("supporting docs", () => {
  it("parses the syllabus and style spec", () => {
    expect(course.syllabus?.kind).toBe("syllabus");
    expect(course.syllabus?.title.length).toBeGreaterThan(0);
    expect(course.spec?.kind).toBe("spec");
  });
});
