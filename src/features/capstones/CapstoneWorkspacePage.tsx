import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { course } from "../../content";
import { getAllExercises } from "../../db/exerciseRepo";
import { ExerciseControl } from "../exercises/ExerciseControl";
import styles from "./CapstoneWorkspacePage.module.css";

/**
 * E11 — the per-capstone workspace (`/capstones/:capstoneId`). Richer than the
 * flat `/exercises` list: the full brief is available inline, every deliverable
 * carries its own done toggle + notes pane (shared with `/exercises` via the
 * exercises store), and the rubric sits persistently alongside as the review
 * standard rather than being tucked into a collapsible.
 */
export function CapstoneWorkspacePage(): React.JSX.Element {
  const { capstoneId } = useParams<{ capstoneId: string }>();
  const capstone = course.capstones.find((c) => c.id === capstoneId);
  const rows = useLiveQuery(getAllExercises, [], []);
  const doneIds = new Set(rows.filter((r) => r.done).map((r) => r.id));

  if (!capstone) {
    return (
      <div>
        <h1>Capstone not found</h1>
        <p>
          No capstone matches this address. <Link to="/capstones">Back to capstones.</Link>
        </p>
      </div>
    );
  }

  const total = capstone.deliverables.length;
  const done = capstone.deliverables.filter((d) => doneIds.has(d.id)).length;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <Link to="/capstones" className={styles.back}>
          ← All capstones
        </Link>
        <h1>
          Capstone {capstone.letter} · {capstone.title}
        </h1>
        <p className={styles.tally}>
          <strong>
            {done} / {total}
          </strong>{" "}
          deliverable{total === 1 ? "" : "s"} done
        </p>
      </header>

      <details className={styles.brief}>
        <summary>Full brief</summary>
        <div className={styles.briefBody}>
          <MarkdownRenderer markdown={capstone.bodyMarkdown} />
        </div>
      </details>

      <div className={styles.columns}>
        <div className={styles.deliverables}>
          <h2 className={styles.sectionTitle}>Deliverables</h2>
          <ul className={styles.list}>
            {capstone.deliverables.map((deliverable) => (
              <li key={deliverable.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemTitle}>
                    {deliverable.index}. {deliverable.title}
                  </span>
                  {doneIds.has(deliverable.id) && <span className={styles.doneTag}>✓ done</span>}
                </div>
                <ExerciseControl sourceId={deliverable.id} kind="capstone" />
              </li>
            ))}
          </ul>
        </div>

        {capstone.rubric.length > 0 && (
          <aside className={styles.rubric} aria-label="Rubric">
            <h2 className={styles.sectionTitle}>Rubric</h2>
            <p className={styles.rubricNote}>Your review standard — grade your work against it.</p>
            <dl className={styles.rubricList}>
              {capstone.rubric.map((row) => (
                <div key={row.criterion} className={styles.rubricRow}>
                  <dt className={styles.rubricCriterion}>{row.criterion}</dt>
                  <dd className={styles.rubricStandard}>{row.standard}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>
    </section>
  );
}
