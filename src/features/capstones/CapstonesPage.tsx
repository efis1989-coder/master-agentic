import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { course } from "../../content";
import { getAllExercises } from "../../db/exerciseRepo";
import styles from "./CapstonesPage.module.css";

/**
 * E11 — the capstones index. Each of the three projects gets a card showing how
 * many of its deliverables are done, linking into a dedicated workspace. Progress
 * is derived live from the shared exercises store (deliverable ids are namespaced
 * `capstone-a/deliverable/1`), so it stays in sync with the `/exercises` board.
 */
export function CapstonesPage(): React.JSX.Element {
  const rows = useLiveQuery(getAllExercises, [], []);
  const doneIds = new Set(rows.filter((r) => r.done).map((r) => r.id));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Capstones</h1>
        <p className={styles.caption}>
          The three end-to-end projects that prove the doctrine in practice. Each has its own
          workspace: the full brief, a deliverable checklist you tick as you build, and the rubric
          kept alongside as your review standard.
        </p>
      </header>

      <ul className={styles.grid}>
        {course.capstones.map((capstone) => {
          const total = capstone.deliverables.length;
          const done = capstone.deliverables.filter((d) => doneIds.has(d.id)).length;
          return (
            <li key={capstone.id}>
              <Link to={`/capstones/${capstone.id}`} className={styles.card}>
                <span className={styles.letter}>Capstone {capstone.letter}</span>
                <span className={styles.title}>{capstone.title}</span>
                <span className={styles.meta}>
                  {total} deliverable{total === 1 ? "" : "s"}
                  {capstone.rubric.length > 0 && ` · ${capstone.rubric.length}-row rubric`}
                </span>
                <span className={styles.progress}>
                  <span className={styles.progressTrack}>
                    <span
                      className={styles.progressFill}
                      style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
                    />
                  </span>
                  <span className={styles.progressLabel}>
                    {done} / {total} done
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
