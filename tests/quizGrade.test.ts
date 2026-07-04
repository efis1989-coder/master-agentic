import { describe, expect, it } from "vitest";
import type { SelfTestClaim } from "../src/content/types";
import { type ClaimAnswer, gradeSelfTest } from "../src/features/quiz/grade";

function claim(over: Partial<SelfTestClaim> & Pick<SelfTestClaim, "id">): SelfTestClaim {
  return {
    index: 1,
    claim: "claim",
    correct: true,
    answerText: "answer",
    gradable: true,
    ...over,
  };
}

describe("gradeSelfTest", () => {
  const claims: SelfTestClaim[] = [
    claim({ id: "ch-x/selftest/1", index: 1, correct: true, gradable: true }),
    claim({ id: "ch-x/selftest/2", index: 2, correct: false, gradable: true }),
    claim({ id: "ch-x/selftest/3", index: 3, correct: false, gradable: false }),
  ];

  it("scores a matched verdict correct and a mismatched one wrong", () => {
    const answers = new Map<string, ClaimAnswer>([
      ["ch-x/selftest/1", { chosen: true, sure: true }], // matches key → correct
      ["ch-x/selftest/2", { chosen: true, sure: false }], // key is false → wrong
    ]);
    const graded = gradeSelfTest(claims.slice(0, 2), answers);
    expect(graded.score).toBe(1);
    expect(graded.total).toBe(2);
    expect(graded.results[0].correct).toBe(true);
    expect(graded.results[0].sure).toBe(true);
    expect(graded.results[1].correct).toBe(false);
  });

  it("always marks an ungradable claim correct (revealed for reflection, not binary)", () => {
    const answers = new Map<string, ClaimAnswer>([
      ["ch-x/selftest/3", { chosen: true, sure: false }],
    ]);
    const graded = gradeSelfTest([claims[2]], answers);
    expect(graded.results[0].correct).toBe(true);
  });

  it("skips claims with no answer", () => {
    const answers = new Map<string, ClaimAnswer>([
      ["ch-x/selftest/1", { chosen: true, sure: false }],
    ]);
    const graded = gradeSelfTest(claims, answers);
    expect(graded.total).toBe(1);
    expect(graded.results.map((r) => r.claim.id)).toEqual(["ch-x/selftest/1"]);
  });
});
