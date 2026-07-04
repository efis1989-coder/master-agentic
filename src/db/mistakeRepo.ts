import { db } from "./db";
import type { MistakeKind, MistakeRow } from "./types";

/**
 * E3 Mistake Journal. One open entry per missed item, keyed by the item's id, so
 * logging a "why I missed it" note overwrites any prior note for that item. A
 * later milestone auto-enqueues unresolved entries into the SRS deck. `resolved`
 * is filtered in memory rather than via a Dexie index (boolean indexing is
 * unreliable in IndexedDB).
 */
const mistakes = () => db.table<MistakeRow, string>("mistakes");

export function addMistake(input: {
  sourceId: string;
  kind: MistakeKind;
  whyMissed: string;
}): Promise<string> {
  const row: MistakeRow = {
    id: input.sourceId,
    sourceId: input.sourceId,
    kind: input.kind,
    whyMissed: input.whyMissed,
    resolved: false,
    at: Date.now(),
  };
  return mistakes().put(row);
}

export function getMistakes(): Promise<MistakeRow[]> {
  return mistakes().orderBy("at").reverse().toArray();
}

export function getMistakesForChapter(chapterId: string): Promise<MistakeRow[]> {
  return mistakes().where("sourceId").startsWith(`${chapterId}/`).toArray();
}

export function setMistakeResolved(id: string, resolved: boolean): Promise<number> {
  return mistakes().update(id, { resolved });
}

export function deleteMistake(id: string): Promise<void> {
  return mistakes().delete(id);
}
