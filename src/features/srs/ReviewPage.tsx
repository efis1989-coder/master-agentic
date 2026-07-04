import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { course } from "../../content";
import { getDueCards, reviewCard } from "../../db/srsRepo";
import type { SrsCardRow } from "../../db/types";
import type { SrsGrade } from "../../srs/sm2";
import styles from "./ReviewPage.module.css";

/**
 * `/review` — the spaced-repetition session. On entry it snapshots the cards due
 * now into a session queue so grading advances deterministically (a lapsed card
 * that becomes due-again does not immediately jump back to the front). Recall is
 * open and self-graded: read the prompt, recall it from memory, reveal to confirm
 * against the source chapter, then grade Again/Hard/Good/Easy → SM-2 lite
 * reschedules. Cards re-enqueued mid-session surface on the next visit.
 */
export function ReviewPage(): React.JSX.Element {
  const [queue, setQueue] = useState<SrsCardRow[] | null>(null);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    let live = true;
    getDueCards().then((due) => {
      if (live) setQueue(due);
    });
    return () => {
      live = false;
    };
  }, []);

  if (queue === null) return <section className={styles.page} />;

  const total = queue.length;
  const card = queue[pos];

  if (!card) {
    return (
      <section className={styles.page}>
        <h1>Review</h1>
        {reviewed > 0 ? (
          <p className={styles.done}>
            Session complete — {reviewed} card{reviewed === 1 ? "" : "s"} reviewed. Come back
            tomorrow for the next batch.
          </p>
        ) : (
          <p className={styles.empty}>
            Nothing due right now. Add §8 review cards from a chapter, or miss a self-test claim —
            those land here for spaced practice.
          </p>
        )}
      </section>
    );
  }

  const chapter = course.byId.get(card.chapterId);

  async function grade(g: SrsGrade): Promise<void> {
    await reviewCard(card.cardId, g);
    setReviewed((n) => n + 1);
    setRevealed(false);
    setPos((p) => p + 1);
  }

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <h1>Review</h1>
        <span className={styles.counter}>
          {pos + 1} / {total}
        </span>
      </div>

      <article className={styles.card}>
        <div className={styles.cardMeta}>
          {card.kind === "mistake" ? (
            <span className={styles.kindMistake}>From a missed claim</span>
          ) : (
            <span className={styles.kindSrs}>Recall prompt</span>
          )}
          {chapter && (
            <Link to={`/read/${chapter.id}`} className={styles.source}>
              {chapter.number} · {chapter.title}
            </Link>
          )}
        </div>

        <div className={styles.front}>
          <MarkdownRenderer markdown={card.front} />
        </div>

        {revealed ? (
          <div className={styles.grade}>
            <p className={styles.gradeHint}>How well did you recall it?</p>
            <div className={styles.gradeButtons}>
              <Button onClick={() => grade("again")}>Again</Button>
              <Button onClick={() => grade("hard")}>Hard</Button>
              <Button variant="primary" onClick={() => grade("good")}>
                Good
              </Button>
              <Button onClick={() => grade("easy")}>Easy</Button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => setRevealed(true)}>
              Reveal &amp; self-grade
            </Button>
            {chapter && (
              <Link to={`/read/${chapter.id}`} className={styles.check}>
                Check the chapter →
              </Link>
            )}
          </div>
        )}
      </article>
    </section>
  );
}
