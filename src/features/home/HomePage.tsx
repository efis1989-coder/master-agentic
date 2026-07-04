import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { course } from "../../content";
import { getLastLocation } from "../../db/appStateRepo";
import styles from "./HomePage.module.css";

/**
 * Course overview / landing. Shows a "continue where you left off" banner when a
 * prior reading location exists, the map (Parts → chapters), and entry points.
 */
export function HomePage(): React.JSX.Element {
  const first = course.chapters[0];
  const last = useLiveQuery(getLastLocation);
  const resume = last?.chapterId ? course.byId.get(last.chapterId) : undefined;

  return (
    <div>
      <section className={styles.hero}>
        <h1>Production Agentic Systems</h1>
        <p className={styles.lede}>
          A failure-driven, doctrine-anchored curriculum on designing, operating, and governing
          agentic systems — read it like a book, then prove it with self-tests, spaced review, and a
          mock certification exam.
        </p>

        {resume && (
          <Link to={`/read/${resume.id}`} className={styles.resume}>
            <span className={styles.resumeLabel}>Continue where you left off</span>
            <span className={styles.resumeTitle}>
              {resume.number} {resume.title}
            </span>
          </Link>
        )}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.chapters.length}</span>
            <span className={styles.statLabel}>chapters</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.parts.length}</span>
            <span className={styles.statLabel}>parts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.capstones.length}</span>
            <span className={styles.statLabel}>capstones</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{course.exam.totalQuestions}</span>
            <span className={styles.statLabel}>exam questions</span>
          </div>
        </div>

        <div className={styles.cta}>
          {first && (
            <Link to={`/read/${first.id}`} className={styles.ctaPrimary}>
              Start with {first.number} {first.title} →
            </Link>
          )}
        </div>
      </section>

      {course.parts.map((part) => (
        <section key={part.part} className={styles.part}>
          <div className={styles.partHead}>
            <h2>
              Part {part.part} — {part.name}
            </h2>
            <span>{part.chapters.length} chapters</span>
          </div>
          <ul className={styles.chapters}>
            {part.chapters.map((ch) => (
              <li key={ch.id}>
                <Link to={`/read/${ch.id}`} className={styles.chapterRow}>
                  <span className={styles.num}>{ch.number}</span>
                  <span>{ch.title}</span>
                  <span className={styles.domain}>{ch.domain}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
