import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { addNote, deleteNote, getNotesForSection, updateNote } from "../../db/notesRepo";
import type { HighlightColor } from "../../db/types";
import styles from "./Highlightable.module.css";
import { type QuoteAnchor, describeSelection, repaintNotes } from "./highlight";

/** The four tints offered in the selection popover, in swatch order. */
const COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

interface PendingSelection {
  anchor: QuoteAnchor;
  x: number;
  y: number;
}

interface OpenNote {
  id: string;
  x: number;
  y: number;
}

/**
 * Wraps a run of chapter prose so a reader can select text to highlight it (with
 * an optional margin note) and click an existing highlight to edit or remove it.
 *
 * Selection and click are bound as native DOM listeners on the wrapper (via a ref
 * effect) rather than JSX handlers: the highlightable region is a passive block of
 * text, not an interactive control, so it carries no role and no keyboard handler.
 * Notes for the section are live-queried; every change repaints the marks over the
 * (memoised, non-reconciled) rendered Markdown underneath.
 */
export function Highlightable({
  sectionId,
  chapterId,
  children,
}: {
  sectionId: string;
  chapterId: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const notes = useLiveQuery(() => getNotesForSection(sectionId), [sectionId], []);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [open, setOpen] = useState<OpenNote | null>(null);
  const [draft, setDraft] = useState("");

  // Repaint marks whenever the note set changes. Cleanup unwraps them so a re-run
  // (or unmount) never leaves stale <mark> elements behind.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    repaintNotes(host, notes ?? []);
    return () => repaintNotes(host, []);
  }, [notes]);

  const localPoint = useCallback((clientX: number, clientY: number) => {
    const box = hostRef.current?.getBoundingClientRect();
    return { x: clientX - (box?.left ?? 0), y: clientY - (box?.top ?? 0) };
  }, []);

  // Native selection + click handlers, bound on the wrapper element.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onMouseUp = (e: MouseEvent) => {
      // A click on an existing mark opens its editor instead of starting a highlight.
      const mark = (e.target as HTMLElement).closest?.("mark.note-mark");
      if (mark instanceof HTMLElement && mark.dataset.noteId) {
        setPending(null);
        const p = localPoint(e.clientX, e.clientY);
        setOpen({ id: mark.dataset.noteId, x: p.x, y: p.y });
        return;
      }
      const anchor = describeSelection(host);
      if (!anchor) return;
      const p = localPoint(e.clientX, e.clientY);
      setOpen(null);
      setPending({ anchor, x: p.x, y: p.y });
    };

    host.addEventListener("mouseup", onMouseUp);
    return () => host.removeEventListener("mouseup", onMouseUp);
  }, [localPoint]);

  // Dismiss the popover on outside pointerdown or Escape.
  useEffect(() => {
    if (!pending && !open) return;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.(`.${styles.popover}`)) return;
      setPending(null);
      setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPending(null);
        setOpen(null);
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [pending, open]);

  async function createHighlight(color: HighlightColor): Promise<void> {
    if (!pending) return;
    await addNote({
      sectionId,
      chapterId,
      quote: pending.anchor.quote,
      prefix: pending.anchor.prefix,
      suffix: pending.anchor.suffix,
      color,
    });
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }

  const openNote = open ? (notes ?? []).find((n) => n.id === open.id) : undefined;

  // Seed the editor draft from the note whenever a different note is opened.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the open note's id, not the row object.
  useEffect(() => {
    if (openNote) setDraft(openNote.note);
  }, [open?.id]);

  return (
    <div ref={hostRef} className={styles.host}>
      {children}

      {pending && (
        <div className={styles.popover} style={{ left: pending.x, top: pending.y }}>
          <span className={styles.popLabel}>Highlight</span>
          <div className={styles.swatches}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={styles.swatch}
                data-note-color={c}
                aria-label={`Highlight ${c}`}
                onClick={() => void createHighlight(c)}
              />
            ))}
          </div>
        </div>
      )}

      {openNote && open && (
        <div className={styles.popover} style={{ left: open.x, top: open.y }}>
          <div className={styles.swatches}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={
                  c === openNote.color ? `${styles.swatch} ${styles.swatchOn}` : styles.swatch
                }
                data-note-color={c}
                aria-label={`Recolor ${c}`}
                onClick={() => void updateNote(openNote.id, { color: c })}
              />
            ))}
          </div>
          <textarea
            className={styles.input}
            placeholder="Add a note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className={styles.popActions}>
            <button
              type="button"
              className={styles.link}
              onClick={() => {
                void deleteNote(openNote.id);
                setOpen(null);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className={styles.linkPrimary}
              onClick={() => {
                void updateNote(openNote.id, { note: draft });
                setOpen(null);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
