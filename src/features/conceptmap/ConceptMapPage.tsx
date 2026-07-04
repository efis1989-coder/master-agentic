import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DOMAIN_NAMES, THEME_NAMES, course } from "../../content";
import type { Chapter, ThemeTag } from "../../content/types";
import { getAllProgress } from "../../db/progressRepo";
import { getAllQuizAttempts } from "../../db/quizRepo";
import styles from "./ConceptMapPage.module.css";
import { MASTERY_LEVELS, chapterMastery } from "./mastery";

/** E10 — the four spiral threads the syllabus revisits across Parts. */
const THEMES: ThemeTag[] = ["evals", "security", "cost", "state"];

/**
 * E6 — concept-map navigation. A second way through the spiral besides the
 * linear TOC: every chapter is a node tinted by mastery (unread → reading →
 * read → quizzed → mastered), grouped by Part, showing its prerequisites so the
 * dependency structure is visible at a glance. Nodes link into the reader.
 *
 * Mastery is derived live from the reading-progress and self-test stores via the
 * pure {@link chapterMastery}; nothing about the map is persisted.
 */
export function ConceptMapPage(): React.JSX.Element {
  const progress = useLiveQuery(() => getAllProgress(), [], undefined);
  const attempts = useLiveQuery(() => getAllQuizAttempts(), [], undefined);
  // E10 — active spiral thread; null shows every chapter.
  const [theme, setTheme] = useState<ThemeTag | null>(null);

  const progressById = new Map((progress ?? []).map((p) => [p.id, p]));
  // Group attempts by chapter for O(1) per-node lookup.
  const byChapter = new Map<string, NonNullable<typeof attempts>>();
  for (const a of attempts ?? []) {
    const list = byChapter.get(a.chapterId) ?? [];
    list.push(a);
    byChapter.set(a.chapterId, list);
  }
  // A chapter's number ("0.1") lets prereq labels ("Ch. 0.1") resolve to a node.
  const byNumber = new Map(course.chapters.map((c) => [c.number, c]));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Concept map</h1>
        <p className={styles.caption}>
          Every chapter as a node, tinted by how far you've taken it and grouped by Part with its
          prerequisites. A second way to navigate the spiral — jump straight into any chapter.
        </p>
      </header>

      <ul className={styles.legend} aria-label="Mastery legend">
        {MASTERY_LEVELS.map((m) => (
          <li key={m.level} className={styles.legendItem}>
            <span className={styles.dot} data-level={m.level} aria-hidden />
            <span className={styles.legendLabel}>{m.label}</span>
            <span className={styles.legendDesc}>{m.description}</span>
          </li>
        ))}
      </ul>

      <div className={styles.threads} aria-label="Spiral theme threads">
        <span className={styles.threadsLabel}>Thread</span>
        <button
          type="button"
          className={theme === null ? `${styles.chip} ${styles.chipOn}` : styles.chip}
          aria-pressed={theme === null}
          onClick={() => setTheme(null)}
        >
          All
        </button>
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            className={theme === t ? `${styles.chip} ${styles.chipOn}` : styles.chip}
            aria-pressed={theme === t}
            onClick={() => setTheme(theme === t ? null : t)}
          >
            {THEME_NAMES[t]}
          </button>
        ))}
      </div>

      {course.parts.map((part) => {
        const chapters = theme
          ? part.chapters.filter((c) => c.themes.includes(theme))
          : part.chapters;
        if (chapters.length === 0) return null;
        return (
          <section key={part.part} className={styles.part}>
            <h2 className={styles.partName}>
              Part {part.part} · {part.name}
            </h2>
            <div className={styles.grid}>
              {chapters.map((ch) => (
                <Node
                  key={ch.id}
                  chapter={ch}
                  level={chapterMastery(ch, progressById.get(ch.id), byChapter.get(ch.id) ?? [])}
                  byNumber={byNumber}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Node({
  chapter,
  level,
  byNumber,
}: {
  chapter: Chapter;
  level: ReturnType<typeof chapterMastery>;
  byNumber: Map<string, Chapter>;
}): React.JSX.Element {
  const label = MASTERY_LEVELS.find((m) => m.level === level)?.label ?? level;
  return (
    <Link to={`/read/${chapter.id}`} className={styles.node} data-level={level}>
      <span className={styles.nodeHead}>
        <span className={styles.nodeNum}>{chapter.number}</span>
        <span className={styles.nodeLevel}>{label}</span>
      </span>
      <span className={styles.nodeTitle}>{chapter.title}</span>
      <span className={styles.nodeDomain}>
        {chapter.domain} · {DOMAIN_NAMES[chapter.domain]}
      </span>
      {chapter.prerequisites.length > 0 && (
        <span className={styles.prereqs}>
          <span className={styles.prereqLabel}>after</span>
          {chapter.prerequisites.map((p) => {
            const num = p.replace(/^Ch\.\s*/, "");
            const target = byNumber.get(num);
            return (
              <span key={p} className={styles.prereq}>
                {target ? target.number : p}
              </span>
            );
          })}
        </span>
      )}
    </Link>
  );
}
