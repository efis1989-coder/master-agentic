import { db } from "./db";
import type { BackupFile } from "./types";

/**
 * E8 — on-device backup. Because all learner state lives in IndexedDB (which a
 * browser can clear), the app must let you export everything to a JSON file and
 * restore it later. Both directions iterate `db.tables` generically so new
 * milestone tables are covered automatically without touching this module.
 */
export async function exportBackup(): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {};
  await db.transaction("r", db.tables, async () => {
    for (const table of db.tables) {
      tables[table.name] = await table.toArray();
    }
  });
  return {
    app: "agentic-training",
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** Structural guard so a wrong or corrupt file is rejected before any write. */
export function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.app === "agentic-training" &&
    v.version === 1 &&
    typeof v.tables === "object" &&
    v.tables !== null
  );
}

/**
 * Replaces on-device state with a backup's contents. Unknown table names in the
 * file are ignored (forward-compatibility); each known table is cleared then
 * repopulated inside one transaction so a failure leaves the store unchanged.
 */
export async function importBackup(backup: BackupFile): Promise<void> {
  const known = new Set(db.tables.map((t) => t.name));
  await db.transaction("rw", db.tables, async () => {
    for (const [name, rows] of Object.entries(backup.tables)) {
      if (!known.has(name)) continue;
      const table = db.table(name);
      await table.clear();
      if (rows.length > 0) await table.bulkPut(rows);
    }
  });
}
