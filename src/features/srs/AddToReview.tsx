import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "../../components/Button";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import type { SrsPrompt } from "../../content/types";
import { enqueueCard, getCardsForChapter, removeCard } from "../../db/srsRepo";
import styles from "./AddToReview.module.css";

/**
 * §8 spaced-review card in the reader: each from-memory prompt can be added to the
 * `/review` deck (open recall, self-graded). Enqueuing is idempotent and the
 * added/remove state is live, so the control reflects the deck even across tabs.
 */
export function AddToReview({
  chapterId,
  title,
  prompts,
}: {
  chapterId: string;
  title: string;
  prompts: SrsPrompt[];
}): React.JSX.Element | null {
  const inDeck = useLiveQuery(() => getCardsForChapter(chapterId), [chapterId]);
  if (inDeck === undefined) return null;

  const enqueuedSrs = new Set(inDeck.filter((c) => c.kind === "srs").map((c) => c.cardId));
  const addedCount = prompts.filter((p) => enqueuedSrs.has(p.id)).length;

  async function addAll(): Promise<void> {
    await Promise.all(
      prompts.map((p) => enqueueCard({ cardId: p.id, kind: "srs", chapterId, front: p.prompt })),
    );
  }

  return (
    <section className={styles.card} aria-label={`Spaced review: ${title}`}>
      <div className={styles.head}>
        <span className={styles.badge}>Spaced review — from memory</span>
        <h2>8. {title}</h2>
      </div>
      <p className={styles.caption}>
        Recall each prompt from a blank page, then add it to your spaced deck. Due cards surface on{" "}
        <strong>Review</strong> and space out as you get them right.
      </p>
      <ol className={styles.prompts}>
        {prompts.map((p) => {
          const added = enqueuedSrs.has(p.id);
          return (
            <li key={p.id} className={styles.prompt}>
              <div className={styles.promptText}>
                <MarkdownRenderer markdown={p.prompt} />
              </div>
              <Button
                variant={added ? "ghost" : "default"}
                onClick={() =>
                  added
                    ? removeCard(p.id)
                    : enqueueCard({ cardId: p.id, kind: "srs", chapterId, front: p.prompt })
                }
              >
                {added ? "Remove" : "Add to review"}
              </Button>
            </li>
          );
        })}
      </ol>
      {addedCount < prompts.length && (
        <div className={styles.actions}>
          <Button variant="primary" onClick={addAll}>
            Add all {prompts.length} to review
          </Button>
        </div>
      )}
    </section>
  );
}
