import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { course } from "../../content";
import { getAllExercises } from "../../db/exerciseRepo";
import { ExerciseControl } from "./ExerciseControl";
import styles from "./ExercisesPage.module.css";

/**
 * The global exercise board (`/exercises`): every hands-on artifact you build
 * "aside" in one place — §6 design exercises grouped by chapter, each capstone's
 * deliverables checked against its rubric, and the mock exam's design prompts.
 * Completion is live-shared with the reader, so ticking here or there stays in
 * sync. A header tally shows how much of the practical work is done.
 */
export function ExercisesPage(): React.JSX.Element {
  const rows = useLiveQuery(getAllExercises, [], []);
  const doneIds = new Set(rows.filter((r) => r.done).map((r) => r.id));

  const designChapters = course.chapters.filter((c) => c.exercise);
  const total =
    designChapters.length +
    course.capstones.reduce((n, c) => n + c.deliverables.length, 0) +
    course.exam.designPrompts.length;
  const done = doneIds.size;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Exercises &amp; capstones</h1>
        <p className={styles.caption}>
          The build-it-yourself work. Do each one aside — on a whiteboard, in an editor — then mark
          it done and (optionally) paste what you built for later review.
        </p>
        <p className={styles.tally}>
          <strong>
            {done} / {total}
          </strong>{" "}
          done
        </p>
      </header>

      <div className={styles.group}>
        <h2 className={styles.groupTitle}>Design exercises</h2>
        <p className={styles.groupNote}>One §6 whiteboard prompt per chapter.</p>
        <ul className={styles.list}>
          {designChapters.map((chapter) => {
            const exercise = chapter.exercise;
            if (!exercise) return null;
            return (
              <li key={exercise.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <Link to={`/read/${chapter.id}`} className={styles.itemSource}>
                    {chapter.number} · {chapter.title}
                  </Link>
                  {doneIds.has(exercise.id) && <span className={styles.doneTag}>✓ done</span>}
                </div>
                <div className={styles.prompt}>
                  <MarkdownRenderer markdown={exercise.prompt} />
                </div>
                {exercise.reviewStandard && (
                  <p className={styles.standard}>
                    <span className={styles.standardLabel}>Review standard</span>
                    {exercise.reviewStandard}
                  </p>
                )}
                <ExerciseControl sourceId={exercise.id} kind="design" />
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.group}>
        <h2 className={styles.groupTitle}>Capstones</h2>
        <p className={styles.groupNote}>
          Each project has its own workspace — the full brief, a deliverable checklist, and the
          rubric alongside.
        </p>
        <ul className={styles.list}>
          {course.capstones.map((capstone) => {
            const totalDeliverables = capstone.deliverables.length;
            const doneDeliverables = capstone.deliverables.filter((d) => doneIds.has(d.id)).length;
            return (
              <li key={capstone.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <Link to={`/capstones/${capstone.id}`} className={styles.itemSource}>
                    Capstone {capstone.letter} · {capstone.title}
                  </Link>
                  <span className={styles.doneTag}>
                    {doneDeliverables} / {totalDeliverables} done
                  </span>
                </div>
                <p className={styles.groupNote}>
                  {totalDeliverables} deliverable{totalDeliverables === 1 ? "" : "s"}
                  {capstone.rubric.length > 0 && ` · ${capstone.rubric.length}-row rubric`} ·{" "}
                  <Link to={`/capstones/${capstone.id}`}>open workspace →</Link>
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.group}>
        <h2 className={styles.groupTitle}>Exam design prompts</h2>
        <p className={styles.groupNote}>
          The certification's open-ended prompts — draft an answer, then self-rate against the
          rubric.
        </p>
        <ul className={styles.list}>
          {course.exam.designPrompts.map((prompt) => (
            <li key={prompt.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.itemSource}>
                  {prompt.n}. {prompt.title}
                </span>
                {doneIds.has(prompt.id) && <span className={styles.doneTag}>✓ done</span>}
              </div>
              <div className={styles.prompt}>
                <MarkdownRenderer markdown={prompt.prompt} />
              </div>
              <p className={styles.standard}>
                <span className={styles.standardLabel}>Rubric</span>
                {prompt.rubric}
              </p>
              <ExerciseControl sourceId={prompt.id} kind="examPrompt" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
