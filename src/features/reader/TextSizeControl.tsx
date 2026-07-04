import { useState } from "react";
import styles from "./TextSizeControl.module.css";
import { type TextSize, readTextSize, setTextSize, stepTextSize } from "./textSize";

/**
 * Segmented A− / A / A+ control for the reading font size. A− and A+ step the
 * saved size (clamped s…xl); the middle A resets to medium. Reads the initial
 * value lazily so it matches whatever the pre-paint script already applied.
 * Only prose scales — headings use em, sidebar/nav stay fixed.
 */
export function TextSizeControl(): React.JSX.Element {
  const [size, setSize] = useState<TextSize>(() => readTextSize());

  const commit = (next: TextSize) => {
    setTextSize(next);
    setSize(next);
  };

  return (
    <div className={styles.control} role="toolbar" aria-label="Reading text size">
      <button
        type="button"
        className={styles.btn}
        onClick={() => commit(stepTextSize(size, -1))}
        disabled={size === "s"}
        aria-label="Decrease text size"
      >
        A<span className={styles.minus}>−</span>
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={() => commit("m")}
        aria-label="Reset text size"
        aria-pressed={size === "m"}
      >
        A
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={() => commit(stepTextSize(size, 1))}
        disabled={size === "xl"}
        aria-label="Increase text size"
      >
        A<span className={styles.plus}>+</span>
      </button>
    </div>
  );
}
