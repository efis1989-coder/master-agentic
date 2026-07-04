import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";
import { DOMAIN_NAMES, course } from "../../content";
import type { ExamQuestion, OptionLetter } from "../../content/types";
import { listExamSessions, saveExamSession } from "../../db/examRepo";
import type { ExamSessionRow } from "../../db/types";
import { ExerciseControl } from "../exercises/ExerciseControl";
import styles from "./ExamPage.module.css";
import { type ExamResult, scoreExam } from "./score";

const exam = course.exam;

/**
 * Mock Exam mode (Milestone 10): the 60-question certification blueprint, auto-
 * scored against the real bar — overall ≥51/60 AND every domain at or above its
 * 70% floor. Three phases: an intro with attempt history, the runner (all
 * questions with options shuffled per attempt so the uniformly-"B" source key is
 * never a tell), and a result view with per-domain meters, per-question rationale
 * review, and the three design prompts captured via the shared exercise control.
 */
type Phase = { kind: "intro" } | { kind: "taking" } | { kind: "result"; session: ExamSessionRow };

export function ExamPage(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const history = useLiveQuery(() => listExamSessions(), [], undefined);

  if (phase.kind === "taking") {
    return (
      <ExamRunner
        onCancel={() => setPhase({ kind: "intro" })}
        onSubmit={(session) => setPhase({ kind: "result", session })}
      />
    );
  }

  if (phase.kind === "result") {
    return (
      <ExamReview
        session={phase.session}
        onRetake={() => setPhase({ kind: "taking" })}
        onClose={() => setPhase({ kind: "intro" })}
      />
    );
  }

  return (
    <ExamIntro
      history={history}
      onStart={() => setPhase({ kind: "taking" })}
      onReview={(session) => setPhase({ kind: "result", session })}
    />
  );
}

function ExamIntro({
  history,
  onStart,
  onReview,
}: {
  history: ExamSessionRow[] | undefined;
  onStart: () => void;
  onReview: (session: ExamSessionRow) => void;
}): React.JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Mock certification exam</h1>
        <p className={styles.caption}>
          {exam.totalQuestions} questions across six domains. The pass bar is the real one:{" "}
          {exam.passOverall}/{exam.totalQuestions} overall <strong>and</strong> every domain at or
          above its floor. Options are shuffled each attempt; answer all to submit.
        </p>
      </header>

      <div className={styles.startRow}>
        <Button variant="primary" onClick={onStart}>
          Start exam
        </Button>
      </div>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Past attempts</h2>
        {history === undefined ? (
          <p className={styles.groupNote}>Loading…</p>
        ) : history.length === 0 ? (
          <p className={styles.groupNote}>
            No attempts yet — take the exam to see your score here.
          </p>
        ) : (
          <ul className={styles.list}>
            {history.map((s) => (
              <li key={s.id} className={styles.historyItem}>
                <button type="button" className={styles.historyButton} onClick={() => onReview(s)}>
                  <span className={s.passed ? styles.pass : styles.fail}>
                    {s.passed ? "PASS" : "Not yet"}
                  </span>
                  <span className={styles.historyScore}>
                    {s.correctCount}/{s.total}
                  </span>
                  <span className={styles.historyDate}>
                    {new Date(s.finishedAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function ExamRunner({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (session: ExamSessionRow) => void;
}): React.JSX.Element {
  // The runner always mounts fresh (from intro or result), so these lazy
  // initializers run once per attempt. Options are shuffled here; the correct
  // letter stays bound to its text, so display order never leaks the uniformly
  // "B" source key and never affects scoring.
  const [startedAt] = useState(() => Date.now());
  const [shuffled] = useState(() =>
    exam.questions.map((q) => ({ q, options: shuffle(q.options) })),
  );
  const [answers, setAnswers] = useState<Record<string, OptionLetter>>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === exam.questions.length;

  function submit(): void {
    const result = scoreExam(
      exam.questions,
      new Map(Object.entries(answers)),
      exam.domainFloors,
      exam.passOverall,
    );
    const session: ExamSessionRow = {
      id: crypto.randomUUID(),
      startedAt,
      finishedAt: Date.now(),
      answers,
      correctCount: result.correctCount,
      total: result.total,
      scoreByDomain: result.scoreByDomain,
      passedOverall: result.passedOverall,
      passedFloors: result.passedFloors,
      passed: result.passed,
    };
    saveExamSession(session);
    onSubmit(session);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Mock exam in progress</h1>
        <div className={styles.runnerBar}>
          <ProgressBar value={answeredCount / exam.questions.length} />
          <span className={styles.count}>
            {answeredCount}/{exam.questions.length} answered
          </span>
        </div>
      </header>

      <ol className={styles.questions}>
        {shuffled.map(({ q, options }) => (
          <li key={q.id} className={styles.question}>
            <p className={styles.stem}>
              <span className={styles.qnum}>{q.n}.</span> {q.stem}
            </p>
            <div className={styles.options}>
              {options.map((opt) => (
                <label key={opt.letter} className={styles.option}>
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === opt.letter}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.letter }))}
                  />
                  <span>{opt.text}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.footer}>
        <Button variant="primary" onClick={submit} disabled={!allAnswered}>
          Submit exam
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {!allAnswered && (
          <span className={styles.hint}>Answer all {exam.questions.length} to submit.</span>
        )}
      </div>
    </div>
  );
}

function DomainRow({
  domain,
  correct,
  count,
  floor,
  passed,
}: ExamResult["scoreByDomain"][number]): React.JSX.Element {
  return (
    <div className={styles.domainRow}>
      <ProgressBar
        value={count === 0 ? 0 : correct / count}
        label={`${domain} — ${DOMAIN_NAMES[domain]}`}
      />
      <span className={passed ? styles.domainOk : styles.domainBad}>
        {correct}/{count} · floor {floor} {passed ? "✓" : "✗"}
      </span>
    </div>
  );
}

function ReviewQuestion({
  question,
  chosen,
}: {
  question: ExamQuestion;
  chosen: OptionLetter | undefined;
}): React.JSX.Element {
  const isCorrect = chosen === question.correct;
  const chosenText = question.options.find((o) => o.letter === chosen)?.text ?? "(no answer)";
  const correctText = question.options.find((o) => o.letter === question.correct)?.text ?? "";
  return (
    <li className={styles.reviewQ}>
      <p className={styles.stem}>
        <span className={styles.qnum}>{question.n}.</span> {question.stem}
      </p>
      <p className={isCorrect ? styles.ok : styles.wrong}>
        <span className={styles.mark}>{isCorrect ? "✓" : "✗"}</span> Your answer: {chosenText}
      </p>
      {!isCorrect && <p className={styles.ok}>Correct: {correctText}</p>}
      <p className={styles.rationale}>{question.rationale}</p>
    </li>
  );
}

function ExamReview({
  session,
  onRetake,
  onClose,
}: {
  session: ExamSessionRow;
  onRetake: () => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.reviewHead}>
          <span className={session.passed ? styles.verdict : `${styles.verdict} ${styles.fail}`}>
            {session.passed ? "PASS" : "Not yet"}
          </span>
          <span className={styles.bigScore}>
            {session.correctCount}/{session.total}
          </span>
        </div>
        <p className={styles.caption}>
          {session.passedOverall ? "Cleared the overall bar" : "Below the overall bar"} ·{" "}
          {session.passedFloors ? "all domain floors met" : "at least one domain below floor"}.
        </p>
      </header>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>By domain</h2>
        <div className={styles.domains}>
          {session.scoreByDomain.map((d) => (
            <DomainRow key={d.domain} {...d} />
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Answer review</h2>
        <ol className={styles.review}>
          {exam.questions.map((q) => (
            <ReviewQuestion key={q.id} question={q} chosen={session.answers[q.id]} />
          ))}
        </ol>
      </section>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Design prompts</h2>
        <p className={styles.groupNote}>
          Open-ended — build your answer aside, then self-rate it against the rubric.
        </p>
        <ul className={styles.list}>
          {exam.designPrompts.map((p) => (
            <li key={p.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.itemSource}>Design prompt {p.n}</span>
                <strong>{p.title}</strong>
              </div>
              <p className={styles.prompt}>{p.prompt}</p>
              <div className={styles.standard}>
                <span className={styles.standardLabel}>Rubric</span>
                {p.rubric}
              </div>
              <ExerciseControl sourceId={p.id} kind="examPrompt" />
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.footer}>
        <Button variant="primary" onClick={onRetake}>
          Retake exam
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Back to overview
        </Button>
      </div>
    </div>
  );
}
