import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { DOMAIN_NAMES, THEME_NAMES, course } from "../../content";
import { useReaderProgress } from "../../hooks/useReaderProgress";
import { isTypingTarget } from "../../lib/keyboard";
import { DesignExerciseCard } from "../exercises/DesignExerciseCard";
import { Highlightable } from "../notes/Highlightable";
import { SelfTestQuiz } from "../quiz/SelfTestQuiz";
import { AddToReview } from "../srs/AddToReview";
import { TeachBack } from "../teachback/TeachBack";
import { IncidentHook } from "./IncidentHook";
import { MiniToc, sectionAnchorId } from "./MiniToc";
import styles from "./ReaderPage.module.css";
import { ReadingProgress } from "./ReadingProgress";
import { TextSizeControl } from "./TextSizeControl";

/**
 * Book view for one chapter: metadata header, the E1 incident cold open in
 * place of §1, then every remaining section rendered as Markdown (Mermaid +
 * syntax highlighting included), and prev/next paging across the linear course
 * order. §6 becomes the design-exercise checklist item, §7 the spoiler-gated
 * self-test, §8 the review-card enqueue; the chapter closes with an E2
 * teach-back recall against its doctrine. The rest reads as the book.
 */
export function ReaderPage(): React.JSX.Element {
  const { chapterId } = useParams<{ chapterId: string }>();
  const chapter = chapterId ? course.byId.get(chapterId) : undefined;
  const index = chapter ? course.chapters.findIndex((c) => c.id === chapter.id) : -1;
  const prev = index > 0 ? course.chapters[index - 1] : undefined;
  const next =
    index >= 0 && index < course.chapters.length - 1 ? course.chapters[index + 1] : undefined;

  // Restore the last scroll position on entry and persist progress while reading.
  useReaderProgress(chapter?.id);

  // j/k page through the linear course order, unless focus is in a field.
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "j" && next) navigate(`/read/${next.id}`);
      else if (e.key === "k" && prev) navigate(`/read/${prev.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, prev, next]);

  // Jump-to-source from /notes: the target section arrives in router state. Wait a
  // tick so the chapter's sections have mounted, then scroll the anchor into view
  // (this wins over useReaderProgress's saved-scroll restore, which fires first).
  const location = useLocation();
  const scrollToSection =
    typeof (location.state as { scrollToSection?: unknown } | null)?.scrollToSection === "number"
      ? (location.state as { scrollToSection: number }).scrollToSection
      : undefined;
  useEffect(() => {
    if (scrollToSection === undefined) return;
    const id = setTimeout(() => {
      document.getElementById(sectionAnchorId(scrollToSection))?.scrollIntoView();
    }, 80);
    return () => clearTimeout(id);
  }, [scrollToSection]);

  if (!chapter) {
    return (
      <div>
        <h1>Chapter not found</h1>
        <p>
          No chapter matches this address. <Link to="/">Return to the overview.</Link>
        </p>
      </div>
    );
  }

  return (
    <article>
      <ReadingProgress />
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.eyebrow}>
            Part {chapter.part} · {chapter.partName}
          </div>
          <TextSizeControl />
        </div>
        <h1 className={styles.title}>
          {chapter.number} · {chapter.title}
        </h1>
        <div className={styles.meta}>
          <span>
            {chapter.domain} — {DOMAIN_NAMES[chapter.domain]}
          </span>
          <span>~{chapter.readingTimeMin} min read</span>
        </div>
        {chapter.themes.length > 0 && (
          <div className={styles.themes}>
            {chapter.themes.map((t) => (
              <span key={t} className={styles.themeTag}>
                {THEME_NAMES[t]}
              </span>
            ))}
          </div>
        )}
        {chapter.prerequisites.length > 0 && (
          <div className={styles.prereq}>Prerequisites: {chapter.prerequisites.join(", ")}</div>
        )}
      </header>

      <MiniToc sections={chapter.sections} />

      {chapter.sections.map((section) => {
        let body: React.JSX.Element;
        if (section.n === 1 && chapter.incident) {
          body = <IncidentHook title={section.title} incident={chapter.incident} />;
        } else if (section.n === 6 && chapter.exercise) {
          body = <DesignExerciseCard title={section.title} exercise={chapter.exercise} />;
        } else if (section.n === 7 && chapter.selfTest.length > 0) {
          body = (
            <SelfTestQuiz chapterId={chapter.id} title={section.title} claims={chapter.selfTest} />
          );
        } else if (section.n === 8 && chapter.srsCards.length > 0) {
          body = (
            <AddToReview chapterId={chapter.id} title={section.title} prompts={chapter.srsCards} />
          );
        } else {
          body = (
            <Highlightable sectionId={`${chapter.id}/sec/${section.n}`} chapterId={chapter.id}>
              <section className={styles.section}>
                <MarkdownRenderer
                  markdown={`## ${section.n}. ${section.title}\n\n${section.markdown}`}
                />
              </section>
            </Highlightable>
          );
        }
        return (
          <div key={section.n} id={sectionAnchorId(section.n)} className={styles.sectionAnchor}>
            {body}
          </div>
        );
      })}

      {chapter.doctrine && <TeachBack chapterId={chapter.id} doctrine={chapter.doctrine} />}

      <nav className={styles.pager} aria-label="Chapter navigation">
        {prev ? (
          <Link to={`/read/${prev.id}`} className={styles.pagerLink}>
            <span className={styles.pagerDir}>← Previous</span>
            <span className={styles.pagerTitle}>
              {prev.number} {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/read/${next.id}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
            <span className={styles.pagerDir}>Next →</span>
            <span className={styles.pagerTitle}>
              {next.number} {next.title}
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
