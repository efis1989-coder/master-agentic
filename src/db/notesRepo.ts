import { db } from "./db";
import type { HighlightColor, NoteRow } from "./types";

/**
 * Notes & highlights store. Many rows per section, so each is keyed by a
 * generated id (unlike the one-per-chapter teach-back/mistake stores). The
 * `notes` table has no typed accessor on the Dexie subclass, so it is reached
 * generically here.
 */
const notes = () => db.table<NoteRow, string>("notes");

/** Every note on one section, for painting highlights back onto the prose. */
export function getNotesForSection(sectionId: string): Promise<NoteRow[]> {
  return notes().where("sectionId").equals(sectionId).toArray();
}

/** All notes newest-first, for the `/notes` review list. */
export function getAllNotes(): Promise<NoteRow[]> {
  return notes().orderBy("at").reverse().toArray();
}

export function getNote(id: string): Promise<NoteRow | undefined> {
  return notes().get(id);
}

/** Create a highlight (with an optional margin note). Returns the new id. */
export async function addNote(input: {
  sectionId: string;
  chapterId: string;
  quote: string;
  prefix: string;
  suffix: string;
  color: HighlightColor;
  note?: string;
}): Promise<string> {
  const row: NoteRow = {
    id: crypto.randomUUID(),
    sectionId: input.sectionId,
    chapterId: input.chapterId,
    quote: input.quote,
    prefix: input.prefix,
    suffix: input.suffix,
    note: input.note ?? "",
    color: input.color,
    at: Date.now(),
  };
  await notes().add(row);
  return row.id;
}

/** Edit a note's text and/or recolour its highlight. */
export function updateNote(
  id: string,
  patch: { note?: string; color?: HighlightColor },
): Promise<number> {
  return notes().update(id, patch);
}

export function deleteNote(id: string): Promise<void> {
  return notes().delete(id);
}
