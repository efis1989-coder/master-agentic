import { useEffect, useId, useRef, useState } from "react";
import { THEME_EVENT, resolvedTheme } from "../features/theme/theme";

/**
 * Renders one Mermaid diagram. Mermaid is heavy (~500 kB), so it is imported
 * dynamically the first time a diagram mounts — keeping it out of the initial
 * bundle and off the critical path for readers who never open a diagram-heavy
 * chapter. Re-renders when `code` or the active theme changes.
 */
export function Mermaid({ code }: { code: string }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const [error, setError] = useState<string | null>(null);
  // Bumped whenever the theme flips (manual toggle or OS change while on system),
  // so the render effect below re-runs and repaints the SVG in the new palette.
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const bump = () => setThemeTick((t) => t + 1);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", bump);
    window.addEventListener(THEME_EVENT, bump);
    return () => {
      mq.removeEventListener("change", bump);
      window.removeEventListener(THEME_EVENT, bump);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: themeTick is a deliberate re-render trigger, repainting the SVG when the theme flips.
  useEffect(() => {
    let cancelled = false;
    const domId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

    void (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        const dark = resolvedTheme() === "dark";
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark ? "dark" : "default",
          fontFamily: "inherit",
        });
        const { svg } = await mermaid.render(domId, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Diagram failed to render");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, rawId, themeTick]);

  if (error) {
    return (
      <pre style={{ color: "var(--color-danger)", whiteSpace: "pre-wrap" }}>
        Diagram error: {error}
        {"\n\n"}
        {code}
      </pre>
    );
  }

  return <div ref={ref} className="mermaid-diagram" aria-label="diagram" />;
}
