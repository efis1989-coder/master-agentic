import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "../../components/Button";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import type { SelfTestClaim } from "../../content/types";
import { addMistake, getMistakesForChapter } from "../../db/mistakeRepo";
import { getAttemptsForChapter, recordQuizAttempt } from "../../db/quizRepo";
import { enqueueCard } from "../../db/srsRepo";
import type { MistakeRow, QuizAttempt } from "../../db/types";
import styles from "./SelfTestQuiz.module.css";
import { type ClaimAnswer, gradeSelfTest } from "./grade";

/**
 * §7 self-test, spoiler-gated. The learner judges each claim True/False (with an
 * "I'm sure" tap for E4 confidence calibration); only after submitting all five
 * is the chapter's argued answer key revealed and the run scored. Attempts are
 * keyed by claim id, so a retake overwrites the prior verdict. Wrong claims offer
 * an E3 Mistake-Journal note.
 */
export function SelfTestQuiz({
  chapterId,
  title,
  claims,
}: {
  chapterId: string;
  title: string;
  claims: SelfTestClaim[];
}): React.JSX.Element | null {
  const attempts = useLiveQuery(() => getAttemptsForChapter(chapterId), [chapterId]);
  const [retaking, setRetaking] = useState(false);

  if (attempts === undefined) return null; // first async resolve

  const byId = new Map(attempts.map((a) => [a.itemId, a]));
  const complete = claims.every((c) => byId.has(c.id));

  return (
    <section className={styles.quiz} aria-label={`Self-test: ${title}`}>
      <span className={styles.badge}>Self-test — judge each claim</span>
      <h2>7. {title}</h2>
      {complete && !retaking ? (
        <CompletedQuiz
          chapterId={chapterId}
          claims={claims}
          byId={byId}
          onRetake={() => setRetaking(true)}
        />
      ) : (
        <TakingQuiz chapterId={chapterId} claims={claims} onSubmitted={() => setRetaking(false)} />
      )}
    </section>
  );
}

interface Draft {
  chosen: boolean | null;
  sure: boolean;
}

function TakingQuiz({
  chapterId,
  claims,
  onSubmitted,
}: {
  chapterId: string;
  claims: SelfTestClaim[];
  onSubmitted: () => void;
}): React.JSX.Element {
  const [draft, setDraft] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(claims.map((c) => [c.id, { chosen: null, sure: false }])),
  );
  const [saving, setSaving] = useState(false);

  const allAnswered = claims.every((c) => draft[c.id]?.chosen !== null);

  function setChosen(id: string, chosen: boolean): void {
    setDraft((d) => ({ ...d, [id]: { chosen, sure: d[id]?.sure ?? false } }));
  }
  function setSure(id: string, sure: boolean): void {
    setDraft((d) => ({ ...d, [id]: { chosen: d[id]?.chosen ?? null, sure } }));
  }

  async function submit(): Promise<void> {
    if (!allAnswered || saving) return;
    setSaving(true);
    const answers = new Map<string, ClaimAnswer>();
    for (const c of claims) {
      const d = draft[c.id];
      if (d?.chosen === null || d?.chosen === undefined) continue;
      answers.set(c.id, { chosen: d.chosen, sure: d.sure });
    }
    const graded = gradeSelfTest(claims, answers);
    await Promise.all(
      graded.results.map((r) =>
        recordQuizAttempt({
          itemId: r.claim.id,
          chapterId,
          chosen: r.chosen,
          correct: r.correct,
          sure: r.sure,
        }),
      ),
    );
    setSaving(false);
    onSubmitted();
  }

  return (
    <div>
      <ol className={styles.claims}>
        {claims.map((claim) => {
          const d = draft[claim.id];
          return (
            <li key={claim.id}>
              <fieldset className={styles.claim}>
                <legend className={styles.claimLegend}>Claim {claim.index}</legend>
                <div className={styles.claimText}>
                  <MarkdownRenderer markdown={claim.claim} />
                </div>
                <div className={styles.verdict}>
                  <label className={styles.verdictOption}>
                    <input
                      type="radio"
                      name={claim.id}
                      checked={d?.chosen === true}
                      onChange={() => setChosen(claim.id, true)}
                    />
                    True
                  </label>
                  <label className={styles.verdictOption}>
                    <input
                      type="radio"
                      name={claim.id}
                      checked={d?.chosen === false}
                      onChange={() => setChosen(claim.id, false)}
                    />
                    False
                  </label>
                  <label className={styles.sure}>
                    <input
                      type="checkbox"
                      checked={d?.sure ?? false}
                      onChange={(e) => setSure(claim.id, e.target.checked)}
                    />
                    I'm sure
                  </label>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div className={styles.actions}>
        <Button variant="primary" onClick={submit} disabled={!allAnswered || saving}>
          {saving ? "Scoring…" : "Submit & reveal answers"}
        </Button>
        {!allAnswered && <span className={styles.hint}>Judge all five claims to submit.</span>}
      </div>
    </div>
  );
}

function CompletedQuiz({
  chapterId,
  claims,
  byId,
  onRetake,
}: {
  chapterId: string;
  claims: SelfTestClaim[];
  byId: Map<string, QuizAttempt>;
  onRetake: () => void;
}): React.JSX.Element {
  const mistakes = useLiveQuery(() => getMistakesForChapter(chapterId), [chapterId]);
  const mistakeById = new Map((mistakes ?? []).map((m) => [m.sourceId, m]));
  const score = claims.filter((c) => byId.get(c.id)?.correct).length;

  return (
    <div>
      <p className={styles.score}>
        <strong>
          {score} / {claims.length}
        </strong>{" "}
        correct
      </p>
      <ol className={styles.claims}>
        {claims.map((claim) => {
          const attempt = byId.get(claim.id);
          const correct = attempt?.correct ?? false;
          return (
            <li key={claim.id}>
              <div className={`${styles.result} ${correct ? styles.ok : styles.wrong}`}>
                <div className={styles.resultHead}>
                  <span className={styles.mark}>{correct ? "✓" : "✗"}</span>
                  <span className={styles.yourVerdict}>
                    You judged: {attempt?.chosen ? "True" : "False"}
                    {attempt?.sure && <span className={styles.sureTag}>sure</span>}
                  </span>
                </div>
                <div className={styles.claimText}>
                  <MarkdownRenderer markdown={claim.claim} />
                </div>
                <details className={styles.answer} open={!correct}>
                  <summary>Argued answer</summary>
                  <MarkdownRenderer markdown={claim.answerText} />
                </details>
                {!correct && (
                  <MistakeInput
                    sourceId={claim.id}
                    chapterId={chapterId}
                    front={claim.claim}
                    existing={mistakeById.get(claim.id)}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className={styles.actions}>
        <Button onClick={onRetake}>Retake self-test</Button>
      </div>
    </div>
  );
}

function MistakeInput({
  sourceId,
  chapterId,
  front,
  existing,
}: {
  sourceId: string;
  chapterId: string;
  front: string;
  existing: MistakeRow | undefined;
}): React.JSX.Element {
  const [text, setText] = useState(existing?.whyMissed ?? "");
  const [saved, setSaved] = useState(false);

  async function save(): Promise<void> {
    const why = text.trim();
    if (!why) return;
    await addMistake({ sourceId, kind: "selftest", whyMissed: why });
    // Close the loop: a missed claim also becomes a self-graded review card.
    await enqueueCard({ cardId: sourceId, kind: "mistake", chapterId, front });
    setSaved(true);
  }

  const fieldId = `why-${sourceId.replace(/\W+/g, "-")}`;
  return (
    <div className={styles.mistake}>
      <label htmlFor={fieldId} className={styles.mistakeLabel}>
        Mistake journal — why did I miss this?
      </label>
      <textarea
        id={fieldId}
        className={styles.mistakeInput}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="One line: the reasoning gap, not the fact."
      />
      <div className={styles.actions}>
        <Button onClick={save} disabled={!text.trim()}>
          {existing ? "Update note" : "Log it"}
        </Button>
        {saved && <span className={styles.savedTag}>Saved to /mistakes</span>}
      </div>
    </div>
  );
}
