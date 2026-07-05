import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import styles from "./SampleSolution.module.css";

/**
 * §6 "book solution" reveal for the open half of a design task. Spoiler-gated
 * behind a native `<details>` (matching the reader's other reveal idioms) so the
 * learner commits to their own answer first, then self-compares. Purely
 * presentational — closeness is self-reported via the exercise's done control.
 */
export function SampleSolution({ markdown }: { markdown: string }): React.JSX.Element {
  return (
    <details className={styles.reveal}>
      <summary className={styles.summary}>Reveal sample solution</summary>
      <div className={styles.body}>
        <MarkdownRenderer markdown={markdown} />
      </div>
    </details>
  );
}
