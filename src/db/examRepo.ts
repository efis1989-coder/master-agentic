import { db } from "./db";
import type { ExamSessionRow } from "./types";

/**
 * Repository for mock-exam attempts (Milestone 10). The `examSessions` table is
 * declared untyped in the schema, so it is reached through a typed accessor.
 * Every completed run is retained; the intro screen lists them newest-first.
 */
const sessions = () => db.table<ExamSessionRow, string>("examSessions");

/** Persist a completed exam attempt. */
export function saveExamSession(row: ExamSessionRow): Promise<string> {
  return sessions().put(row);
}

/** All attempts, most recent first. */
export function listExamSessions(): Promise<ExamSessionRow[]> {
  return sessions().orderBy("startedAt").reverse().toArray();
}

/** One attempt by id, or undefined if it was never saved. */
export function getExamSession(id: string): Promise<ExamSessionRow | undefined> {
  return sessions().get(id);
}
