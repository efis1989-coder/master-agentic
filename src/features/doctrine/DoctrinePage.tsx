import { Link } from "react-router-dom";
import { course } from "../../content";
import type { Chapter } from "../../content/types";
import styles from "./DoctrinePage.module.css";

/**
 * E9 — the doctrine "golden thread." Every chapter states one bold doctrine
 * sentence (§2) and closes its second act with a `> Doctrine check.` blockquote
 * (§3); collected here on one page, in reading order, they form the spine of the
 * whole curriculum for a single pre-exam pass. Read-only: nothing is persisted.
 */
export function DoctrinePage(): React.JSX.Element {
  const withDoctrine = course.chapters.filter((c) => c.doctrine || c.doctrineCheck);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Doctrine · the golden thread</h1>
        <p className={styles.caption}>
          One doctrine sentence per chapter, in order — the argued spine of the course on a single
          page. Read it top to bottom the night before the exam; each row jumps back to its chapter.
        </p>
      </header>

      {course.parts.map((part) => {
        const chapters = part.chapters.filter((c) => c.doctrine || c.doctrineCheck);
        if (chapters.length === 0) return null;
        return (
          <section key={part.part} className={styles.part}>
            <h2 className={styles.partName}>
              Part {part.part} · {part.name}
            </h2>
            <ol className={styles.list}>
              {chapters.map((ch) => (
                <Row key={ch.id} chapter={ch} />
              ))}
            </ol>
          </section>
        );
      })}

      {withDoctrine.length === 0 && (
        <p className={styles.caption}>No doctrine statements were found in the current content.</p>
      )}
    </div>
  );
}

function Row({ chapter }: { chapter: Chapter }): React.JSX.Element {
  return (
    <li className={styles.row}>
      <Link to={`/read/${chapter.id}`} className={styles.source}>
        <span className={styles.num}>{chapter.number}</span>
        <span>{chapter.title}</span>
      </Link>
      {chapter.doctrine && <p className={styles.doctrine}>{chapter.doctrine}</p>}
      {chapter.doctrineCheck && (
        <blockquote className={styles.check}>
          <span className={styles.checkLabel}>Doctrine check</span>
          {chapter.doctrineCheck}
        </blockquote>
      )}
      {chapter.glossary.length > 0 && (
        <details className={styles.glossary}>
          <summary className={styles.glossarySummary}>
            Key terms ({chapter.glossary.length})
          </summary>
          <ul className={styles.glossaryList}>
            {chapter.glossary.map((term) => (
              <li key={term.term}>
                <Link
                  to={`/read/${chapter.id}`}
                  state={{ scrollToSection: term.sectionN }}
                  className={styles.glossaryLink}
                >
                  {term.term}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}
