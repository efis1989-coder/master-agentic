import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SearchModal } from "../features/search/SearchModal";
import { isTypingTarget } from "../lib/keyboard";
import styles from "./Layout.module.css";
import { Toc } from "./Toc";

/**
 * App shell: a persistent TOC sidebar on desktop that collapses into an
 * off-canvas drawer on mobile. The drawer auto-closes on route change and on
 * Escape. The reading column is width-capped for comfortable line length.
 * ⌘/Ctrl-K and "/" open the chapter search palette from anywhere.
 */
export function Layout(): React.JSX.Element {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Close the drawer whenever the route changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional close-on-navigate.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Global palette hotkeys: ⌘/Ctrl-K always, and "/" when not already typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "/" && !searchOpen && !isTypingTarget(e.target)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`}>
        <Toc onNavigate={() => setDrawerOpen(false)} />
      </aside>

      {drawerOpen && (
        <button
          type="button"
          className={styles.drawerOverlay}
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
          <span className={styles.topbarTitle}>Production Agentic Systems</span>
          <button
            type="button"
            className={styles.searchButton}
            aria-label="Search chapters"
            onClick={() => setSearchOpen(true)}
          >
            ⌕
          </button>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
