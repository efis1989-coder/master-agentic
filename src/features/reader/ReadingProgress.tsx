import { useEffect, useRef } from "react";
import styles from "./ReadingProgress.module.css";

/**
 * Thin accent bar pinned to the top of the reader that tracks how far the window
 * is scrolled through the document. Width is written straight to the DOM inside a
 * requestAnimationFrame tick (no per-scroll React re-render), and the rAF is
 * coalesced so a burst of scroll events schedules at most one update per frame.
 */
export function ReadingProgress(): React.JSX.Element {
  const barRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    const update = () => {
      frame.current = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? doc.scrollTop / scrollable : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
      }
    };
    const onScroll = () => {
      if (frame.current === 0) frame.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div ref={barRef} className={styles.bar} />
    </div>
  );
}
