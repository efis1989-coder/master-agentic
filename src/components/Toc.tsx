import { useLiveQuery } from "dexie-react-hooks";
import { NavLink } from "react-router-dom";
import { course } from "../content";
import { countDue } from "../db/srsRepo";
import { BackupControls } from "../features/backup/BackupControls";
import { ThemeToggle } from "../features/theme/ThemeToggle";
import styles from "./Toc.module.css";

/**
 * Part → chapter table of contents plus the top-level section links. Rendered
 * both in the desktop sidebar and inside the mobile drawer; `onNavigate` lets
 * the drawer close itself after a selection.
 */
export function Toc({ onNavigate }: { onNavigate?: () => void }): React.JSX.Element {
  const link = (isActive: boolean, base: string, active: string) =>
    isActive ? `${base} ${active}` : base;
  const dueCount = useLiveQuery(() => countDue(), []) ?? 0;

  return (
    <nav className={styles.toc} aria-label="Course contents">
      <NavLink to="/" className={styles.brand} onClick={onNavigate}>
        Production Agentic Systems
        <span>
          {course.chapters.length} chapters · {course.capstones.length} capstones · mock exam
        </span>
      </NavLink>

      <div className={styles.nav}>
        <NavLink
          to="/map"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Concept map
        </NavLink>
        <NavLink
          to="/doctrine"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Doctrine
        </NavLink>
        <NavLink
          to="/progress"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Progress
        </NavLink>
        <NavLink
          to="/review"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Review
          {dueCount > 0 && (
            <span className={styles.badge} aria-label={`${dueCount} cards due`}>
              {dueCount}
            </span>
          )}
        </NavLink>
        <NavLink
          to="/mistakes"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Mistakes
        </NavLink>
        <NavLink
          to="/exercises"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Exercises
        </NavLink>
        <NavLink
          to="/capstones"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Capstones
        </NavLink>
        <NavLink
          to="/notes"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Notes
        </NavLink>
        <NavLink
          to="/exam"
          onClick={onNavigate}
          className={({ isActive }) => link(isActive, styles.navLink, styles.navLinkActive)}
        >
          Mock Exam
        </NavLink>
      </div>

      {course.parts.map((part) => (
        <div key={part.part} className={styles.part}>
          <div className={styles.partName}>
            Part {part.part} · {part.name}
          </div>
          {part.chapters.map((ch) => (
            <NavLink
              key={ch.id}
              to={`/read/${ch.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                link(isActive, styles.chapterLink, styles.chapterLinkActive)
              }
            >
              <span className={styles.num}>{ch.number}</span>
              <span>{ch.title}</span>
            </NavLink>
          ))}
        </div>
      ))}

      <ThemeToggle />
      <BackupControls />
    </nav>
  );
}
