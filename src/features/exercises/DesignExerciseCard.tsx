import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import type { DesignExercise } from "../../content/types";
import { DesignCheck } from "./DesignCheck";
import styles from "./DesignExerciseCard.module.css";
import { ExerciseControl } from "./ExerciseControl";
import { SampleSolution } from "./SampleSolution";

/**
 * §6 design exercise in the reader: the whiteboard prompt and its explicit
 * review standard. Branches on the authored exercise shape:
 *   - `check` present → a deterministic dropdown check (auto-scored, spoiler-gated),
 *     which subsumes the done state via its own submit.
 *   - otherwise → the shared free-text done/answer control.
 * A `sampleSolution`, when authored, renders in either branch as a spoiler-gated
 * "book solution" for the open half of the task (e.g. the residual reasoning a
 * dropdown check can't score), placed after the interactive element so the learner
 * commits first, then self-compares. Either way the exercise is done "aside";
 * completion feeds the `/exercises` board and the progress dashboard.
 */
export function DesignExerciseCard({
  title,
  exercise,
}: {
  title: string;
  exercise: DesignExercise;
}): React.JSX.Element {
  return (
    <section className={styles.card} aria-label={`Design exercise: ${title}`}>
      <div className={styles.head}>
        <span className={styles.badge}>Design exercise — do it aside</span>
        <h2>6. {title}</h2>
      </div>
      <div className={styles.prompt}>
        <MarkdownRenderer markdown={exercise.prompt} />
      </div>
      {exercise.reviewStandard && (
        <div className={styles.standard}>
          <span className={styles.standardLabel}>Review standard</span>
          <MarkdownRenderer markdown={exercise.reviewStandard} />
        </div>
      )}
      {exercise.check ? (
        <div className={styles.actions}>
          <DesignCheck exerciseId={exercise.id} check={exercise.check} />
        </div>
      ) : (
        <div className={styles.actions}>
          <ExerciseControl sourceId={exercise.id} kind="design" />
        </div>
      )}
      {exercise.sampleSolution && (
        <div className={styles.sample}>
          <SampleSolution markdown={exercise.sampleSolution} />
        </div>
      )}
    </section>
  );
}
