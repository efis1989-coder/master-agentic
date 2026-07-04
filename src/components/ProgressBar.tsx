import styles from "./ProgressBar.module.css";

/**
 * A slim completion meter built on the native, accessible `<progress>` element
 * (no ARIA role needed). `value` is a 0..1 fraction; it is clamped and rendered
 * as an integer percentage.
 */
export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}): React.JSX.Element {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return <progress className={styles.bar} value={pct} max={100} aria-label={label} />;
}
