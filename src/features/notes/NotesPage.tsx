import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button";
import { course } from "../../content";
import { deleteNote, getAllNotes } from "../../db/notesRepo";
import type { NoteRow } from "../../db/types";
import styles from "./NotesPage.module.css";

/** Pull the section number out of a "<chapterId>/sec/<n>" sectionId. */
function sectionOf(sectionId: string): number | undefined {
  const n = Number.parseInt(sectionId.split("/sec/")[1] ?? "", 10);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * `/notes`: every highlight and margin note across the book, newest first, each
 * a jump-to-source link. Following a link carries the target section number in
 * router state so {@link ReaderPage} scrolls straight to it.
 */
export function NotesPage(): React.JSX.Element {
  const notes = useLiveQuery(getAllNotes, [], []);

  return (
    <section className={styles.page}>
      <h1>Notes &amp; highlights</h1>
      <p className={styles.caption}>
        Select text in any chapter to highlight it and attach a note. Everything you mark lands
        here, linking back to where you found it.
      </p>

      {notes.length === 0 ? (
        <p className={styles.empty}>
          No notes yet. Highlight a passage while reading and it will show up here.
        </p>
      ) : (
        <ul className={styles.list}>
          {notes.map((n) => (
            <NoteCard key={n.id} row={n} />
          ))}
        </ul>
      )}
    </section>
  );
}

function NoteCard({ row }: { row: NoteRow }): React.JSX.Element {
  const chapter = course.byId.get(row.chapterId);
  const section = sectionOf(row.sectionId);

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.swatch} data-note-color={row.color} aria-hidden="true" />
        {chapter ? (
          <Link
            to={`/read/${chapter.id}`}
            state={{ scrollToSection: section }}
            className={styles.source}
          >
            {chapter.number} · {chapter.title}
          </Link>
        ) : (
          <span className={styles.source}>{row.chapterId}</span>
        )}
      </div>

      <blockquote className={styles.quote} data-note-color={row.color}>
        {row.quote}
      </blockquote>
      {row.note.trim() !== "" && <p className={styles.note}>{row.note}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => deleteNote(row.id)}>
          Delete
        </Button>
      </div>
    </li>
  );
}
