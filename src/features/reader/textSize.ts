/**
 * Reading text-size preference (s / m / l / xl), persisted on-device.
 *
 * Only the prose measure scales: the preference is written as a `--reading-scale`
 * multiplier on `<html>`, which `--reading-font-size` in global.css multiplies
 * into the body copy. Headings use em units, so they scale in proportion while
 * the sidebar/nav (fixed px) stay put. The same key is read by the pre-paint
 * inline script in index.html to avoid a flash on load; keep the key and the
 * scale map in sync if they ever change here.
 */
export type TextSize = "s" | "m" | "l" | "xl";

const STORAGE_KEY = "agentic-text-scale";
const SCALE: Record<TextSize, number> = { s: 0.94, m: 1, l: 1.08, xl: 1.18 };
const ORDER: TextSize[] = ["s", "m", "l", "xl"];

/** Broadcast on any change so controls can re-sync their active state. */
export const TEXT_SIZE_EVENT = "agentic-textsizechange";

/** The saved size, defaulting to "m" when unset or unreadable. */
export function readTextSize(): TextSize {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "s" || raw === "m" || raw === "l" || raw === "xl") return raw;
  } catch {
    // storage disabled (private mode) — fall through to medium.
  }
  return "m";
}

/** Write the scale multiplier onto `<html>` so prose resizes live. */
export function applyTextSize(size: TextSize): void {
  document.documentElement.style.setProperty("--reading-scale", String(SCALE[size]));
}

/** Persist, apply, and notify listeners. The single write path for the control. */
export function setTextSize(size: TextSize): void {
  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {
    // best-effort persistence; the in-session apply below still takes effect.
  }
  applyTextSize(size);
  window.dispatchEvent(new CustomEvent(TEXT_SIZE_EVENT));
}

/** Step one size toward smaller/larger, clamped at the ends. */
export function stepTextSize(size: TextSize, dir: -1 | 1): TextSize {
  const next = ORDER.indexOf(size) + dir;
  return ORDER[Math.min(ORDER.length - 1, Math.max(0, next))];
}
