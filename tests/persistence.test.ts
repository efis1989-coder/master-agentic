import { beforeEach, describe, expect, it } from "vitest";
import { getLastLocation, saveLastLocation } from "../src/db/appStateRepo";
import { exportBackup, importBackup, isBackupFile } from "../src/db/backup";
import { db } from "../src/db/db";
import { getAllProgress, getProgress, recordProgress } from "../src/db/progressRepo";
import type { BackupFile } from "../src/db/types";

// fake-indexeddb (loaded in tests/setup.ts) backs Dexie here; wipe every table
// between tests so state never leaks across cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("progressRepo", () => {
  it("records and reads back per-chapter progress", async () => {
    await recordProgress({ chapterId: "ch-0-1", scrollPct: 0.4, status: "reading" });
    const row = await getProgress("ch-0-1");
    expect(row?.status).toBe("reading");
    expect(row?.scrollPct).toBeCloseTo(0.4);
  });

  it("never downgrades a chapter already marked read back to reading", async () => {
    await recordProgress({ chapterId: "ch-0-1", scrollPct: 1, status: "read" });
    await recordProgress({ chapterId: "ch-0-1", scrollPct: 0.2, status: "reading" });
    const row = await getProgress("ch-0-1");
    expect(row?.status).toBe("read");
    // Scroll fraction still updates so restore lands where the reader actually is.
    expect(row?.scrollPct).toBeCloseTo(0.2);
  });

  it("lists all progress rows", async () => {
    await recordProgress({ chapterId: "ch-0-1", scrollPct: 1, status: "read" });
    await recordProgress({ chapterId: "ch-0-2", scrollPct: 0.5, status: "reading" });
    const all = await getAllProgress();
    expect(all.map((r) => r.id).sort()).toEqual(["ch-0-1", "ch-0-2"]);
  });
});

describe("appStateRepo", () => {
  it("saves and restores the last location as a singleton", async () => {
    await saveLastLocation({ route: "/read/ch-0-1", chapterId: "ch-0-1", scrollPct: 0.3 });
    await saveLastLocation({ route: "/read/ch-0-2", chapterId: "ch-0-2", scrollPct: 0.1 });
    const last = await getLastLocation();
    expect(last?.chapterId).toBe("ch-0-2");
    // A second write overwrites rather than appends.
    expect(await db.appState.count()).toBe(1);
  });
});

describe("backup (E8)", () => {
  it("round-trips all tables through export then import", async () => {
    await recordProgress({ chapterId: "ch-0-1", scrollPct: 1, status: "read" });
    await saveLastLocation({ route: "/read/ch-0-1", chapterId: "ch-0-1", scrollPct: 1 });

    const backup = await exportBackup();
    expect(isBackupFile(backup)).toBe(true);
    expect(backup.tables.progress).toHaveLength(1);

    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await getProgress("ch-0-1")).toBeUndefined();

    await importBackup(backup);
    expect((await getProgress("ch-0-1"))?.status).toBe("read");
    expect((await getLastLocation())?.chapterId).toBe("ch-0-1");
  });

  it("rejects a non-backup object", () => {
    expect(isBackupFile({ app: "something-else", version: 1, tables: {} })).toBe(false);
    expect(isBackupFile(null)).toBe(false);
    expect(isBackupFile({ app: "agentic-training", version: 1 })).toBe(false);
  });

  it("ignores unknown tables in an imported file", async () => {
    const backup: BackupFile = {
      app: "agentic-training",
      version: 1,
      exportedAt: new Date().toISOString(),
      tables: {
        progress: [{ id: "ch-1-1", status: "read", scrollPct: 1, updatedAt: 1 }],
        unknownFutureTable: [{ id: "x" }],
      },
    };
    await importBackup(backup);
    expect((await getProgress("ch-1-1"))?.status).toBe("read");
  });
});
