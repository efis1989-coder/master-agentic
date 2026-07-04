import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import {
  addNote,
  deleteNote,
  getAllNotes,
  getNote,
  getNotesForSection,
  updateNote,
} from "../src/db/notesRepo";

// fake-indexeddb (tests/setup.ts) backs the notes store; wipe between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const base = {
  sectionId: "ch-0-1/sec/2",
  chapterId: "ch-0-1",
  quote: "durable mastery",
  prefix: "build ",
  suffix: " over time",
  color: "yellow" as const,
};

describe("notesRepo (M12)", () => {
  it("adds a note and reads it back by id", async () => {
    const id = await addNote(base);
    const row = await getNote(id);
    expect(row?.quote).toBe("durable mastery");
    expect(row?.color).toBe("yellow");
    expect(row?.note).toBe("");
    expect(typeof row?.at).toBe("number");
  });

  it("scopes getNotesForSection to one section", async () => {
    await addNote(base);
    await addNote({ ...base, sectionId: "ch-0-1/sec/3", quote: "other" });
    const here = await getNotesForSection("ch-0-1/sec/2");
    expect(here).toHaveLength(1);
    expect(here[0].quote).toBe("durable mastery");
  });

  it("orders getAllNotes newest first", async () => {
    const first = await addNote({ ...base, quote: "first" });
    await new Promise((r) => setTimeout(r, 2));
    const second = await addNote({ ...base, quote: "second" });
    const all = await getAllNotes();
    expect(all.map((n) => n.id)).toEqual([second, first]);
  });

  it("updates a note's text and color", async () => {
    const id = await addNote(base);
    await updateNote(id, { note: "the spiral point", color: "blue" });
    const row = await getNote(id);
    expect(row?.note).toBe("the spiral point");
    expect(row?.color).toBe("blue");
  });

  it("deletes a note", async () => {
    const id = await addNote(base);
    await deleteNote(id);
    expect(await getNote(id)).toBeUndefined();
    expect(await getAllNotes()).toHaveLength(0);
  });
});
