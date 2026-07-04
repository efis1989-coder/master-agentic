import { useState } from "react";
import { Button } from "../../components/Button";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import type { IncidentHook as IncidentHookModel } from "../../content";
import styles from "./IncidentHook.module.css";

/**
 * E1 — Diagnose-the-incident cold open. §1 of every chapter is a production
 * failure; we surface it first as an active-recall hook: read the incident,
 * guess what got skipped, then read on to see the chapter derive the answer.
 *
 * The guess is component-local for now; the persistence milestone wires it to
 * IndexedDB so guesses survive reloads.
 */
export function IncidentHook({
  title,
  incident,
}: {
  title: string;
  incident: IncidentHookModel;
}): React.JSX.Element {
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <section className={styles.hook} aria-label="Incident cold open">
      <span className={styles.badge}>Incident — diagnose first</span>
      <h2>1. {title}</h2>
      <MarkdownRenderer markdown={incident.markdown} />

      {incident.skippedQuestion && <p className={styles.question}>{incident.skippedQuestion}</p>}

      <label htmlFor="incident-guess" className={styles.question}>
        Before reading on: what got skipped here?
      </label>
      <textarea
        id="incident-guess"
        className={styles.textarea}
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Your one-line diagnosis…"
      />

      <div className={styles.actions}>
        <Button type="button" onClick={() => setRevealed(true)} disabled={revealed}>
          {revealed ? "Revealed" : "Reveal the thread"}
        </Button>
      </div>

      {revealed && (
        <p className={styles.reveal}>
          Read on — the chapter derives the answer from first principles, then names the discipline
          that would have caught it.
        </p>
      )}
    </section>
  );
}
