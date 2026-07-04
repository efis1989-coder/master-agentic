import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { course } from "../../content";
import styles from "./SearchModal.module.css";
import { type SearchHit, buildSearchIndex, searchChapters } from "./searchIndex";

// The index is derived once from the bundled course; it never changes at runtime.
const index = buildSearchIndex(course.chapters);

/**
 * Command-palette search over every chapter. Opened with ⌘/Ctrl-K or "/" (wired
 * in {@link Layout}); type to filter, ↑/↓ to move, Enter to open, Esc to close.
 * Results come from the pure {@link searchChapters} ranker so behaviour is tested
 * without the DOM.
 */
export function SearchModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const hits = useMemo<SearchHit[]>(() => searchChapters(index, query), [query]);

  // Focus the field on open; keep the active row in range as results shrink.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the selection whenever the query changes.
  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(hit: SearchHit | undefined): void {
    if (!hit) return;
    navigate(`/read/${hit.id}`);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(hits[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div className={styles.backdrop}>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Close search"
        onClick={onClose}
      />
      {/* biome-ignore lint/a11y/useSemanticElements: custom command palette; focus and Escape are managed here, not by a native <dialog> */}
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Search chapters">
        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          placeholder="Search chapters…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          // biome-ignore lint/a11y/noAutofocus: expected for a command palette
          autoFocus
        />

        {query.trim() !== "" && hits.length === 0 ? (
          <p className={styles.empty}>No chapters match “{query.trim()}”.</p>
        ) : (
          <ul className={styles.results}>
            {hits.map((hit, i) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className={i === active ? `${styles.hit} ${styles.hitActive}` : styles.hit}
                  onClick={() => go(hit)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className={styles.hitHead}>
                    <span className={styles.hitNum}>{hit.number}</span>
                    <span className={styles.hitTitle}>{hit.title}</span>
                  </span>
                  <span className={styles.hitPart}>{hit.partName}</span>
                  <span className={styles.hitSnippet}>{hit.snippet}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.footerRow}>
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
