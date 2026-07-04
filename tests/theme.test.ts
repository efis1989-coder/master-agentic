import { afterEach, describe, expect, it } from "vitest";
import {
  THEME_EVENT,
  type ThemePref,
  applyThemePref,
  nextThemePref,
  readThemePref,
  resolvedTheme,
  setThemePref,
} from "../src/features/theme/theme";

// jsdom provides localStorage + document but not matchMedia, so the "system"
// branch of resolvedTheme() is exercised elsewhere; here we cover the explicit
// preferences, persistence, attribute reflection, and the change event.
afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("theme preferences", () => {
  it("defaults to system when nothing is stored", () => {
    expect(readThemePref()).toBe("system");
  });

  it("cycles system → light → dark → system", () => {
    expect(nextThemePref("system")).toBe("light");
    expect(nextThemePref("light")).toBe("dark");
    expect(nextThemePref("dark")).toBe("system");
  });

  it("resolves explicit preferences without touching the media query", () => {
    expect(resolvedTheme("light")).toBe("light");
    expect(resolvedTheme("dark")).toBe("dark");
  });

  it("pins the html attribute for light/dark and drops it for system", () => {
    applyThemePref("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    applyThemePref("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    applyThemePref("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("persists, applies, and announces on setThemePref", () => {
    let announced = 0;
    const onChange = () => {
      announced += 1;
    };
    window.addEventListener(THEME_EVENT, onChange);

    setThemePref("dark");
    expect(localStorage.getItem("agentic-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(announced).toBe(1);

    window.removeEventListener(THEME_EVENT, onChange);
  });

  it("round-trips a stored preference through readThemePref", () => {
    const prefs: ThemePref[] = ["system", "light", "dark"];
    for (const p of prefs) {
      setThemePref(p);
      expect(readThemePref()).toBe(p);
    }
  });
});
