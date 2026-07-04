import { db } from "./db";
import type { TeachBackRow, TeachBackScore } from "./types";

/**
 * E2 teach-back store: one blank-whiteboard recall per chapter, keyed by the
 * chapter id so saving overwrites the current attempt. The `teachBack` table has
 * no typed accessor on the Dexie subclass, so it is reached generically here.
 */
const teach = () => db.table<TeachBackRow, string>("teachBack");

export function getTeachBack(chapterId: string): Promise<TeachBackRow | undefined> {
  return teach().get(chapterId);
}

export function getAllTeachBack(): Promise<TeachBackRow[]> {
  return teach().toArray();
}

export function saveTeachBack(input: {
  chapterId: string;
  text: string;
  selfScore: TeachBackScore | null;
}): Promise<string> {
  const row: TeachBackRow = {
    id: input.chapterId,
    chapterId: input.chapterId,
    text: input.text,
    selfScore: input.selfScore,
    at: Date.now(),
  };
  return teach().put(row);
}
