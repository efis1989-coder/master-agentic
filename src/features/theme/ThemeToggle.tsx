import { useState } from "react";
import styles from "./ThemeToggle.module.css";
import { type ThemePref, nextThemePref, readThemePref, setThemePref } from "./theme";

const META: Record<ThemePref, { icon: string; text: string }> = {
  system: { icon: "◐", text: "System" },
  light: { icon: "☀", text: "Light" },
  dark: { icon: "☾", text: "Dark" },
};

/**
 * Single button that cycles the theme preference (system → light → dark). The
 * label names the current choice; clicking advances and persists it. Reads the
 * initial value lazily so it matches whatever the pre-paint script already applied.
 */
export function ThemeToggle(): React.JSX.Element {
  const [pref, setPref] = useState<ThemePref>(() => readThemePref());

  const cycle = () => {
    const next = nextThemePref(pref);
    setThemePref(next);
    setPref(next);
  };

  const meta = META[pref];
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={cycle}
      aria-label={`Theme: ${meta.text}. Click to change.`}
      title={`Theme: ${meta.text}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {meta.icon}
      </span>
      <span>Theme: {meta.text}</span>
    </button>
  );
}
