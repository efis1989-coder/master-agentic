import { useEffect, useRef } from "react";
import { saveLastLocation } from "../db/appStateRepo";
import { getProgress, recordProgress } from "../db/progressRepo";

/** A chapter counts as fully read once scrolled within this fraction of the end. */
const READ_THRESHOLD = 0.98;
/** Debounce window for scroll persistence, in ms. */
const SAVE_DELAY = 250;

/** Fraction 0..1 of the document scrolled, guarding the not-scrollable case. */
function currentScrollPct(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

/**
 * Wires a chapter's reading state to IndexedDB: on entry it restores the last
 * scroll position (or jumps to the top for a fresh chapter); while reading it
 * debounces writes of scroll fraction and "where you left off", and promotes the
 * chapter to `read` once the reader reaches the end.
 */
export function useReaderProgress(chapterId: string | undefined): void {
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!chapterId) return;
    let cancelled = false;

    // Restore prior scroll after layout settles; default to the top.
    getProgress(chapterId).then((row) => {
      if (cancelled) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, row ? row.scrollPct * Math.max(0, max) : 0);
    });

    const persist = () => {
      const scrollPct = currentScrollPct();
      const status = scrollPct >= READ_THRESHOLD ? "read" : "reading";
      void recordProgress({ chapterId, scrollPct, status });
      void saveLastLocation({ route: `/read/${chapterId}`, chapterId, scrollPct });
    };

    const onScroll = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(persist, SAVE_DELAY);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Record the visit immediately so "resume" points here even without scrolling.
    persist();

    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, [chapterId]);
}
