import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button";
import { course } from "../../content";
import { deleteMistake, getMistakes, setMistakeResolved } from "../../db/mistakeRepo";
import styles from "./MistakesPage.module.css";

/**
 * E3 Mistake Journal review (`/mistakes`): every "why I missed it" note logged
 * against a wrong self-test claim, newest first, each linking back to its
 * chapter. Resolving keeps the note but marks the reasoning gap closed; deleting
 * removes it. A later milestone auto-enqueues unresolved entries into the SRS
 * deck.
 */
export function MistakesPage(): React.JSX.Element {
  const mistakes = useLiveQuery(getMistakes, [], []);
  const open = mistakes.filter((m) => !m.resolved);
  const resolved = mistakes.filter((m) => m.resolved);

  return (
    <section className={styles.page}>
      <h1>Mistake journal</h1>
      <p className={styles.caption}>
        One line per missed claim — the reasoning gap, not the fact. Revisit the chapter, then mark
        it resolved.
      </p>

      {mistakes.length === 0 ? (
        <p className={styles.empty}>
          No mistakes logged yet. When you miss a self-test claim, note why and it lands here.
        </p>
      ) : (
        <>
          <h2 className={styles.h2}>Open ({open.length})</h2>
          {open.length === 0 ? (
            <p className={styles.empty}>Nothing open — every logged gap is resolved.</p>
          ) : (
            <ul className={styles.list}>
              {open.map((m) => (
                <MistakeCard key={m.id} row={m} />
              ))}
            </ul>
          )}

          {resolved.length > 0 && (
            <>
              <h2 className={styles.h2}>Resolved ({resolved.length})</h2>
              <ul className={styles.list}>
                {resolved.map((m) => (
                  <MistakeCard key={m.id} row={m} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

function MistakeCard({
  row,
}: {
  row: { id: string; sourceId: string; whyMissed: string; resolved: boolean };
}): React.JSX.Element {
  const chapterId = row.sourceId.split("/")[0];
  const chapter = course.byId.get(chapterId);

  return (
    <li className={`${styles.card} ${row.resolved ? styles.cardResolved : ""}`}>
      <div className={styles.cardHead}>
        {chapter ? (
          <Link to={`/read/${chapter.id}`} className={styles.source}>
            {chapter.number} · {chapter.title}
          </Link>
        ) : (
          <span className={styles.source}>{row.sourceId}</span>
        )}
        <span className={styles.itemRef}>{row.sourceId}</span>
      </div>
      <p className={styles.why}>{row.whyMissed}</p>
      <div className={styles.actions}>
        <Button onClick={() => setMistakeResolved(row.id, !row.resolved)}>
          {row.resolved ? "Reopen" : "Mark resolved"}
        </Button>
        <Button variant="ghost" onClick={() => deleteMistake(row.id)}>
          Delete
        </Button>
      </div>
    </li>
  );
}
