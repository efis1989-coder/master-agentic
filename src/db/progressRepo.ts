import { db } from "./db";
import type { ProgressRow, ReadStatus } from "./types";

/**
 * Per-chapter reading progress. A chapter is "reading" as soon as it is opened
 * and "read" once scrolled to the end; scrollPct is kept for restoration and
 * for the progress dashboard's per-part bars.
 */
export async function recordProgress(input: {
  chapterId: string;
  scrollPct: number;
  status: ReadStatus;
}): Promise<void> {
  const existing = await db.progress.get(input.chapterId);
  // Never downgrade a chapter already marked read back to reading.
  const status: ReadStatus = existing?.status === "read" ? "read" : input.status;
  const row: ProgressRow = {
    id: input.chapterId,
    status,
    scrollPct: input.scrollPct,
    updatedAt: Date.now(),
  };
  await db.progress.put(row);
}

export function getProgress(chapterId: string): Promise<ProgressRow | undefined> {
  return db.progress.get(chapterId);
}

export function getAllProgress(): Promise<ProgressRow[]> {
  return db.progress.toArray();
}
