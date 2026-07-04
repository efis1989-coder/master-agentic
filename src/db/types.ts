/**
 * Row shapes for the on-device store. Only the tables consumed by the current
 * milestone (resume + reading progress) are typed precisely; the remaining
 * tables from the data model are declared in the schema (see {@link ./db}) so
 * later milestones add rows without a Dexie version bump, and the backup
 * export/import round-trips every table generically.
 */

import type { DomainId, OptionLetter } from "../content/types";

export type ReadStatus = "reading" | "read";

/** Per-chapter reading state. Primary key is the chapter id (e.g. "ch-0-1"). */
export interface ProgressRow {
  id: string;
  status: ReadStatus;
  /** Fraction 0..1 of the chapter scrolled, for scroll restoration. */
  scrollPct: number;
  updatedAt: number;
}

/** Singleton app state rows, keyed by `key` (e.g. "lastLocation"). */
export interface AppStateRow {
  key: string;
  route: string;
  chapterId: string | null;
  scrollPct: number;
  updatedAt: number;
}

/**
 * One graded §7 self-test claim attempt. Keyed by the claim's stable item id so
 * re-taking a chapter's self-test overwrites the prior verdict for that claim
 * (one current attempt per claim). `sure` is the E4 confidence tap, kept on the
 * attempt so the calibration view can compare sure-vs-correct without a join.
 */
export interface QuizAttempt {
  id: string; // == itemId, e.g. "ch-0-1/selftest/3"
  itemId: string;
  chapterId: string;
  chosen: boolean; // the learner's True/False verdict
  correct: boolean; // whether it matched the key
  sure: boolean; // E4 — "I'm sure" toggle
  at: number;
}

export type MistakeKind = "selftest" | "exam";

/**
 * E3 Mistake Journal entry: a one-line "why I missed it" logged against a wrong
 * answer. Keyed by the missed item's id (one open note per item). A later
 * milestone auto-enqueues these into the spaced-repetition deck.
 */
export interface MistakeRow {
  id: string; // == sourceId (the missed item's id)
  sourceId: string;
  kind: MistakeKind;
  whyMissed: string;
  resolved: boolean;
  at: number;
}

/**
 * A source for a spaced-repetition card: a §8 open-recall prompt, or a wrong
 * self-test claim auto-enqueued from the Mistake Journal (E3 → SRS loop).
 */
export type SrsCardKind = "srs" | "mistake";

/**
 * One card in the SM-2 lite deck. Keyed by its source item id (e.g. "ch-0-1/srs/2"
 * or the claim id for a mistake card) so enqueuing is idempotent — re-adding never
 * resets an in-progress card. Scheduling fields mirror {@link ../srs/sm2!SrsState};
 * `dueDate` (epoch ms) ≤ now means the card is due. `front` is the recall prompt
 * shown in `/review`; there is no stored answer (open, self-graded recall).
 */
export interface SrsCardRow {
  id: string; // == cardId
  cardId: string;
  kind: SrsCardKind;
  chapterId: string;
  front: string;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueDate: number;
  createdAt: number;
  lastReviewedAt: number | null;
}

/**
 * What a checked-off exercise came from: a §6 chapter design exercise, one
 * deliverable of a capstone project, or one of the mock-exam design prompts.
 */
export type ExerciseKind = "design" | "capstone" | "examPrompt";

/**
 * One item on the exercise checklist. Keyed by its source item id (the §6
 * exercise id, a capstone deliverable id, or an exam design-prompt id) so
 * ticking it done or pasting an answer upserts the single row for that item.
 * `answer` is the learner's optionally pasted write-up — the work itself is
 * done "aside"; the app only tracks completion and keeps the notes.
 */
export interface ExerciseRow {
  id: string; // == sourceId
  sourceId: string;
  kind: ExerciseKind;
  done: boolean;
  answer: string;
  at: number;
}

/** How well the learner judged their blank-whiteboard teach-back went (E2). */
export type TeachBackScore = "shaky" | "close" | "nailed";

/**
 * E2 teach-back recall: one blank-whiteboard attempt per chapter, keyed by the
 * chapter id (one current attempt). The learner types the chapter's doctrine
 * from memory, reveals the §2 doctrine sentence, then self-scores the gap.
 */
export interface TeachBackRow {
  id: string; // == chapterId
  chapterId: string;
  text: string;
  selfScore: TeachBackScore | null;
  at: number;
}

/**
 * Per-domain slice of a mock-exam result: how many of that domain's questions
 * were answered correctly against its pass floor (see {@link ../content/types!DomainFloor}).
 */
export interface ExamDomainScore {
  domain: DomainId;
  correct: number;
  count: number;
  floor: number;
  passed: boolean;
}

/**
 * One completed mock-exam attempt (Milestone 10). Keyed by a generated id so
 * every run is retained as history. `answers` maps each question id to the
 * chosen option letter; scoring is recomputed and stored so the result view and
 * the progress dashboard read it without re-grading. `passed` is the real cert
 * bar: overall ≥ passOverall AND every domain at or above its floor.
 */
export interface ExamSessionRow {
  id: string;
  startedAt: number;
  finishedAt: number;
  answers: Record<string, OptionLetter>;
  correctCount: number;
  total: number;
  scoreByDomain: ExamDomainScore[];
  passedOverall: boolean;
  passedFloors: boolean;
  passed: boolean;
}

/** The four highlight tints a note can carry. */
export type HighlightColor = "yellow" | "green" | "blue" | "pink";

/**
 * One highlight + optional margin note over a stretch of chapter prose. Keyed by
 * a generated id (many notes per section). The highlighted run is re-located
 * after reload by a context anchor — the exact `quote` plus a little `prefix`/
 * `suffix` on either side — so edits elsewhere in the chapter don't orphan it and
 * repeated phrases stay disambiguated. `sectionId` is "<chapterId>/sec/<n>";
 * `chapterId` is denormalised so the `/notes` list links back without parsing.
 */
export interface NoteRow {
  id: string;
  sectionId: string;
  chapterId: string;
  quote: string;
  prefix: string;
  suffix: string;
  note: string;
  color: HighlightColor;
  at: number;
}

/** Shape of a full backup document (E8). */
export interface BackupFile {
  app: "agentic-training";
  version: 1;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}
