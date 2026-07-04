import styles from "./MiniToc.module.css";

/** The id given to each section wrapper in {@link ReaderPage}. */
export function sectionAnchorId(n: number): string {
  return `sec-${n}`;
}

/**
 * "On this page" jump list for the current chapter. Under HashRouter a plain
 * `#sec-N` anchor would be read as a route, so we scroll imperatively instead of
 * changing the URL hash.
 */
export function MiniToc({
  sections,
}: {
  sections: { n: number; title: string }[];
}): React.JSX.Element {
  function jump(n: number): void {
    document
      .getElementById(sectionAnchorId(n))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className={styles.toc} aria-label="On this page">
      <span className={styles.label}>On this page</span>
      <ol className={styles.list}>
        {sections.map((s) => (
          <li key={s.n}>
            <button type="button" className={styles.link} onClick={() => jump(s.n)}>
              <span className={styles.num}>{s.n}</span>
              {s.title}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
