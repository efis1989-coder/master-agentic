import { useRef, useState } from "react";
import { exportBackup, importBackup, isBackupFile } from "../../db/backup";
import styles from "./BackupControls.module.css";

type Status = { kind: "idle" | "ok" | "error"; message: string };

/**
 * E8 — the on-device safety net. "Export" downloads the whole IndexedDB store as
 * a timestamped JSON file; "Import" reads such a file and replaces local state
 * after an explicit confirm (it overwrites progress, notes, exam history, …).
 * Both actions are user-initiated by the button click.
 */
export function BackupControls(): React.JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  const onExport = async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const stamp = backup.exportedAt.slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentic-training-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: "ok", message: "Backup downloaded." });
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!isBackupFile(parsed)) {
        setStatus({ kind: "error", message: "Not a valid backup file." });
        return;
      }
      if (!window.confirm("Replace all on-device progress with this backup?")) return;
      await importBackup(parsed);
      setStatus({ kind: "ok", message: "Backup restored." });
    } catch {
      setStatus({ kind: "error", message: "Could not read that file." });
    }
  };

  return (
    <div className={styles.backup}>
      <div className={styles.row}>
        <button type="button" className={styles.button} onClick={() => void onExport()}>
          Export
        </button>
        <button type="button" className={styles.button} onClick={() => fileInput.current?.click()}>
          Import
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        className={styles.file}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onImportFile(file);
          e.target.value = "";
        }}
      />
      {status.kind !== "idle" && (
        <output className={status.kind === "error" ? styles.error : styles.ok}>
          {status.message}
        </output>
      )}
    </div>
  );
}
