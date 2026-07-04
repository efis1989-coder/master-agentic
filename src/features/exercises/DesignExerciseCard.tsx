import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import type { DesignExercise } from "../../content/types";
import styles from "./DesignExerciseCard.module.css";
import { ExerciseControl } from "./ExerciseControl";

/**
 * §6 design exercise in the reader: the whiteboard prompt and its explicit
 * review standard, plus the shared done/answer control. The exercise is done
 * "aside"; ticking it feeds the `/exercises` board and the progress dashboard.
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
      <div className={styles.actions}>
        <ExerciseControl sourceId={exercise.id} kind="design" />
      </div>
    </section>
  );
}
