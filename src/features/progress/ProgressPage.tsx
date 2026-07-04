import { useLiveQuery } from "dexie-react-hooks";
import { ProgressBar } from "../../components/ProgressBar";
import { course } from "../../content";
import { getAllProgress } from "../../db/progressRepo";
import styles from "./ProgressPage.module.css";
import type { ProgressBarData } from "./stats";
import { computeProgressStats } from "./stats";

function MeterList({ bars }: { bars: ProgressBarData[] }): React.JSX.Element {
  return (
    <ul className={styles.bars}>
      {bars.map((b) => (
        <li key={b.key} className={styles.bar}>
          <div className={styles.barHead}>
            <span className={styles.barLabel}>{b.label}</span>
            <span className={styles.barCount}>
              {b.read}/{b.total}
            </span>
          </div>
          <ProgressBar value={b.pct} label={b.label} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The `/progress` dashboard (E5): overall reading completion, per-Part bars, and
 * the six certification-domain meters. Reads live from IndexedDB via
 * {@link useLiveQuery} so ticking a chapter read updates it without a refresh.
 */
export function ProgressPage(): React.JSX.Element {
  const rows = useLiveQuery(getAllProgress, [], []);
  const stats = computeProgressStats(rows, course.chapters, course.parts);
  const overallPctLabel = Math.round(stats.overallPct * 100);

  return (
    <section className={styles.page}>
      <h1>Progress</h1>

      <div className={styles.summary}>
        <div className={styles.headline}>
          <span className={styles.big}>{overallPctLabel}%</span>
          <span className={styles.sub}>of the course read</span>
        </div>
        <ProgressBar value={stats.overallPct} label="Overall reading progress" />
        <p className={styles.counts}>
          {stats.chaptersRead} of {stats.totalChapters} chapters read
          {stats.chaptersStarted > 0 && ` · ${stats.chaptersStarted} in progress`}
        </p>
      </div>

      <h2 className={styles.h2}>By part</h2>
      <MeterList bars={stats.byPart} />

      <h2 className={styles.h2}>By domain</h2>
      <p className={styles.caption}>
        The six certification domains. Fed by reading coverage now; self-test and exam accuracy fold
        in as those milestones land.
      </p>
      <MeterList bars={stats.byDomain} />
    </section>
  );
}
