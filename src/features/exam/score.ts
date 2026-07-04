import type { DomainFloor, DomainId, ExamQuestion, OptionLetter } from "../../content/types";
import type { ExamDomainScore } from "../../db/types";

/** Auto-scored outcome of one mock-exam run, before it is persisted. */
export interface ExamResult {
  correctCount: number;
  total: number;
  scoreByDomain: ExamDomainScore[];
  passedOverall: boolean;
  passedFloors: boolean;
  passed: boolean;
}

/**
 * Grade a mock-exam attempt against the certification bar. `answers` maps each
 * question id to the chosen option letter; an absent or non-matching answer is
 * simply wrong. Shuffling options at render time does not affect scoring — the
 * `correct` letter stays bound to its option text, so the comparison holds.
 *
 * The real pass rule is enforced: overall ≥ `passOverall` AND every domain at
 * or above its 70% floor. Domains are reported in `domainFloors` order so the
 * result view mirrors the blueprint even for a domain with no answered items.
 */
export function scoreExam(
  questions: ExamQuestion[],
  answers: Map<string, OptionLetter>,
  domainFloors: DomainFloor[],
  passOverall: number,
): ExamResult {
  const tally = new Map<DomainId, { correct: number; count: number }>();
  let correctCount = 0;

  for (const q of questions) {
    const agg = tally.get(q.domain) ?? { correct: 0, count: 0 };
    agg.count += 1;
    if (answers.get(q.id) === q.correct) {
      correctCount += 1;
      agg.correct += 1;
    }
    tally.set(q.domain, agg);
  }

  const scoreByDomain: ExamDomainScore[] = domainFloors.map((df) => {
    const agg = tally.get(df.domain) ?? { correct: 0, count: df.count };
    return {
      domain: df.domain,
      correct: agg.correct,
      count: df.count,
      floor: df.floor,
      passed: agg.correct >= df.floor,
    };
  });

  const passedOverall = correctCount >= passOverall;
  const passedFloors = scoreByDomain.every((d) => d.passed);

  return {
    correctCount,
    total: questions.length,
    scoreByDomain,
    passedOverall,
    passedFloors,
    passed: passedOverall && passedFloors,
  };
}
