/**
 * E7 — theme preference (system / light / dark), persisted on-device.
 *
 * A "system" preference stores nothing and leaves `<html>` without a `data-theme`
 * attribute, so the `prefers-color-scheme` rules in global.css drive the palette
 * live. "light"/"dark" pin the attribute, overriding the OS. The same key is read
 * by the pre-paint inline script in index.html to avoid a flash on load; keep the
 * key in sync if it ever changes here.
 */
export type ThemePref = "system" | "light" | "dark";

const STORAGE_KEY = "agentic-theme";
const CYCLE: ThemePref[] = ["system", "light", "dark"];

/** Broadcast on any theme change so listeners (e.g. Mermaid) can re-render. */
export const THEME_EVENT = "agentic-themechange";

/** The saved preference, defaulting to "system" when unset or unreadable. */
export function readThemePref(): ThemePref {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // storage disabled (private mode) — fall through to system.
  }
  return "system";
}

/** Reflect a preference onto `<html>`: pin the attribute, or drop it for system. */
export function applyThemePref(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
}

/** Persist, apply, and notify listeners. The single write path for the toggle. */
export function setThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // best-effort persistence; the in-session apply below still takes effect.
  }
  applyThemePref(pref);
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

/** Next preference in the system → light → dark → system cycle. */
export function nextThemePref(pref: ThemePref): ThemePref {
  return CYCLE[(CYCLE.indexOf(pref) + 1) % CYCLE.length];
}

/** The palette actually in effect now; "system" resolves via the media query. */
export function resolvedTheme(pref: ThemePref = readThemePref()): "light" | "dark" {
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return pref;
}
