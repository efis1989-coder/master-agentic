import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "../../components/Button";
import { getExercise, setExerciseAnswer, setExerciseDone } from "../../db/exerciseRepo";
import type { ExerciseKind } from "../../db/types";
import styles from "./ExerciseControl.module.css";

/**
 * The interactive part of any checklist item: a done toggle plus an optional
 * pasted answer. The work is done "aside" — this only records completion and
 * keeps the note. Live-queried so the state matches across the reader and the
 * `/exercises` board. The querier returns `null` (not `undefined`) for an
 * un-started item, so a missing row is distinguishable from the first async load.
 */
export function ExerciseControl({
  sourceId,
  kind,
}: {
  sourceId: string;
  kind: ExerciseKind;
}): React.JSX.Element | null {
  const row = useLiveQuery(async () => (await getExercise(sourceId)) ?? null, [sourceId]);
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (row === undefined) return null; // first async resolve

  const done = row?.done ?? false;
  const value = draft ?? row?.answer ?? "";
  const fieldId = `answer-${sourceId.replace(/\W+/g, "-")}`;

  async function saveAnswer(): Promise<void> {
    await setExerciseAnswer({ sourceId, kind, answer: value.trim() });
    setDraft(null);
    setSaved(true);
  }

  return (
    <div className={styles.control}>
      <label className={styles.doneRow}>
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => setExerciseDone({ sourceId, kind, done: e.target.checked })}
        />
        <span>{done ? "Done" : "Mark done"}</span>
      </label>
      <details className={styles.answer}>
        <summary>Paste your write-up (optional)</summary>
        <label htmlFor={fieldId} className={styles.answerLabel}>
          Your answer — kept on-device for later review.
        </label>
        <textarea
          id={fieldId}
          className={styles.answerInput}
          value={value}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
          placeholder="Paste or outline what you built."
        />
        <div className={styles.actions}>
          <Button onClick={saveAnswer} disabled={draft === null}>
            Save answer
          </Button>
          {saved && <span className={styles.savedTag}>Saved</span>}
        </div>
      </details>
    </div>
  );
}
