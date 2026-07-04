import Dexie, { type Table } from "dexie";
import type { AppStateRow, ProgressRow } from "./types";

/**
 * On-device store for all learner state. One schema version declares every
 * table in the data model up front so feature milestones (quizzes, SRS, exam,
 * notes, …) add rows without a migration, and the backup tool can round-trip
 * the whole database generically. Only the tables used by the current milestone
 * expose typed accessors; the rest are reached via `db.table(name)` when their
 * milestone lands.
 */
export class AgenticDB extends Dexie {
  progress!: Table<ProgressRow, string>;
  appState!: Table<AppStateRow, string>;

  constructor() {
    super("agentic-training");
    this.version(1).stores({
      progress: "id, status, updatedAt",
      appState: "key, updatedAt",
      quizAttempts: "id, itemId, at",
      examSessions: "id, startedAt",
      srsCards: "id, cardId, dueDate",
      exercises: "id, sourceId, kind",
      notes: "id, sectionId, at",
      teachBack: "id, chapterId, at",
      mistakes: "id, sourceId, resolved, at",
      confidence: "attemptId",
    });
  }
}

export const db = new AgenticDB();
