import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "../../components/Button";
import type { DesignCheck as DesignCheckModel } from "../../content/types";
import { getExercise, setExerciseAnswer, setExerciseDone } from "../../db/exerciseRepo";
import styles from "./DesignCheck.module.css";
import { gradeDesignCheck } from "./gradeDesignCheck";

/**
 * Persisted §6 dropdown state, stored as JSON in the shared `ExerciseRow.answer`
 * field so no Dexie schema bump is needed. `selections` is keyed by item id;
 * `submitted` gates the reveal so a reload after submitting restores the scored
 * view (rather than an empty form).
 */
interface PersistedCheck {
  selections: Record<string, string>;
  submitted: boolean;
}

function parsePersisted(answer: string | undefined): PersistedCheck {
  if (answer) {
    try {
      const p = JSON.parse(answer) as Partial<PersistedCheck>;
      if (p && typeof p === "object" && p.selections && typeof p.selections === "object") {
        return {
          selections: p.selections as Record<string, string>,
          submitted: Boolean(p.submitted),
        };
      }
    } catch {
      // A legacy free-text write-up or malformed JSON — start the check fresh.
    }
  }
  return { selections: {}, submitted: false };
}

/**
 * §6 deterministic dropdown check, spoiler-gated like the self-test: one native
 * `<select>` per item, then "Submit & reveal" scores every choice against the
 * authored key and shows ✓/✗, the correct option, and each item's rationale. State
 * persists via the shared exercise row (one row per exercise), so submitting also
 * marks the exercise done for the `/exercises` board and progress dashboard.
 */
export function DesignCheck({
  exerciseId,
  check,
}: {
  exerciseId: string;
  check: DesignCheckModel;
}): React.JSX.Element | null {
  const row = useLiveQuery(async () => (await getExercise(exerciseId)) ?? null, [exerciseId]);
  const [retaking, setRetaking] = useState(false);

  if (row === undefined) return null; // first async resolve

  const persisted = parsePersisted(row?.answer);

  if (persisted.submitted && !retaking) {
    return (
      <CompletedCheck
        check={check}
        selections={persisted.selections}
        onRetake={() => setRetaking(true)}
      />
    );
  }
  return (
    <TakingCheck
      exerciseId={exerciseId}
      check={check}
      initial={persisted.selections}
      onSubmitted={() => setRetaking(false)}
    />
  );
}

function TakingCheck({
  exerciseId,
  check,
  initial,
  onSubmitted,
}: {
  exerciseId: string;
  check: DesignCheckModel;
  initial: Record<string, string>;
  onSubmitted: () => void;
}): React.JSX.Element {
  const [selections, setSelections] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  const allAnswered = check.items.every((it) => Boolean(selections[it.id]));

  async function submit(): Promise<void> {
    if (!allAnswered || saving) return;
    setSaving(true);
    const answer = JSON.stringify({ selections, submitted: true } satisfies PersistedCheck);
    await setExerciseAnswer({ sourceId: exerciseId, kind: "design", answer });
    await setExerciseDone({ sourceId: exerciseId, kind: "design", done: true });
    setSaving(false);
    onSubmitted();
  }

  return (
    <div>
      <ol className={styles.items}>
        {check.items.map((item) => {
          const fieldId = `check-${item.id.replace(/\W+/g, "-")}`;
          return (
            <li key={item.id} className={styles.item}>
              <label htmlFor={fieldId} className={styles.itemLabel}>
                {item.label}
              </label>
              <select
                id={fieldId}
                className={styles.select}
                value={selections[item.id] ?? ""}
                onChange={(e) => setSelections((s) => ({ ...s, [item.id]: e.target.value }))}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {check.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ol>
      <div className={styles.actions}>
        <Button variant="primary" onClick={submit} disabled={!allAnswered || saving}>
          {saving ? "Scoring…" : "Submit & reveal"}
        </Button>
        {!allAnswered && (
          <span className={styles.hint}>Choose an option for every item to submit.</span>
        )}
      </div>
    </div>
  );
}

function CompletedCheck({
  check,
  selections,
  onRetake,
}: {
  check: DesignCheckModel;
  selections: Record<string, string>;
  onRetake: () => void;
}): React.JSX.Element {
  const graded = gradeDesignCheck(check, new Map(Object.entries(selections)));

  return (
    <div>
      <p className={styles.score}>
        <strong>
          {graded.score} / {graded.total}
        </strong>{" "}
        correct
      </p>
      <ol className={styles.items}>
        {graded.results.map(({ item, chosen, correct }) => (
          <li key={item.id} className={`${styles.result} ${correct ? styles.ok : styles.wrong}`}>
            <div className={styles.resultHead}>
              <span className={styles.mark}>{correct ? "✓" : "✗"}</span>
              <span className={styles.itemLabel}>{item.label}</span>
            </div>
            <p className={styles.chosen}>
              You chose: <strong>{chosen ?? "—"}</strong>
              {!correct && (
                <>
                  {" · correct: "}
                  <strong>{item.correct}</strong>
                </>
              )}
            </p>
            {item.rationale && <p className={styles.rationale}>{item.rationale}</p>}
          </li>
        ))}
      </ol>
      <div className={styles.actions}>
        <Button onClick={onRetake}>Retake check</Button>
      </div>
    </div>
  );
}
