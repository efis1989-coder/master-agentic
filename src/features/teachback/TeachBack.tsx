import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "../../components/Button";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { getTeachBack, saveTeachBack } from "../../db/teachBackRepo";
import type { TeachBackScore } from "../../db/types";
import styles from "./TeachBack.module.css";

const SCORES: { value: TeachBackScore; label: string }[] = [
  { value: "shaky", label: "Shaky" },
  { value: "close", label: "Close" },
  { value: "nailed", label: "Nailed it" },
];

/**
 * E2 teach-back recall: the chapter's own mastery bar is "teach it from a blank
 * whiteboard", so this makes teach-back a first-class end-of-chapter action.
 * Write the doctrine from memory, reveal the §2 doctrine sentence, then
 * self-score the gap. One current attempt per chapter, live-queried.
 */
export function TeachBack({
  chapterId,
  doctrine,
}: {
  chapterId: string;
  doctrine: string;
}): React.JSX.Element | null {
  const row = useLiveQuery(async () => (await getTeachBack(chapterId)) ?? null, [chapterId]);
  const [draft, setDraft] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (row === undefined) return null; // first async resolve

  const text = draft ?? row?.text ?? "";
  const score = row?.selfScore ?? null;

  function grade(selfScore: TeachBackScore): void {
    saveTeachBack({ chapterId, text: text.trim(), selfScore });
  }

  return (
    <section className={styles.card} aria-label="Teach-back recall">
      <div className={styles.head}>
        <span className={styles.badge}>Teach-back — from a blank whiteboard</span>
        <h2>Explain this chapter's doctrine from memory</h2>
      </div>
      <p className={styles.caption}>
        Close the book. In a sentence or two, state the chapter's core doctrine as if teaching it —
        then reveal it and score how you did.
      </p>
      <textarea
        className={styles.input}
        value={text}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="The doctrine, in your own words…"
        aria-label="Your teach-back"
      />

      {revealed ? (
        <div className={styles.reveal}>
          <span className={styles.revealLabel}>Chapter doctrine</span>
          <MarkdownRenderer markdown={doctrine} />
          <div className={styles.grade}>
            <p className={styles.gradeHint}>How close were you?</p>
            <div className={styles.gradeButtons}>
              {SCORES.map((s) => (
                <Button
                  key={s.value}
                  variant={score === s.value ? "primary" : "default"}
                  onClick={() => grade(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
            {score && <p className={styles.scored}>Scored: {score}. Saved to this chapter.</p>}
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => setRevealed(true)}>
            Reveal doctrine &amp; self-score
          </Button>
        </div>
      )}
    </section>
  );
}
