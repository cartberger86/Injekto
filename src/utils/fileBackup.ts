import type { AppState } from "../types";
import { jsonExport, parseImport, validateState } from "./importExport";
export interface BackupHandle {
  name: string;
  getFile(): Promise<File>;
  queryPermission(options: { mode: "readwrite" }): Promise<PermissionState>;
  requestPermission(options: { mode: "readwrite" }): Promise<PermissionState>;
  createWritable(): Promise<{
    write(value: string): Promise<void>;
    close(): Promise<void>;
    abort?(): Promise<void>;
  }>;
}
export interface BackupRecord {
  handle: BackupHandle;
  lastRevision: string;
  lastSavedAt: string;
  lastFingerprint?: string;
}
export async function backupFingerprint(state: AppState) {
  const bytes = new TextEncoder().encode(JSON.stringify(validateState(state)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
export const BACKUP_DB = "injekto-log-file-backup";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKUP_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("settings"))
        request.result.createObjectStore("settings");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Die Dateiverknüpfung konnte nicht im Browser gespeichert werden.",
        ),
      );
    request.onblocked = () =>
      reject(
        new Error("Bitte andere App-Tabs schließen und erneut versuchen."),
      );
  });
}
export async function readBackupRecord(): Promise<BackupRecord | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("settings", "readonly"),
        r = tx.objectStore("settings").get("linked-file");
      r.onsuccess = () =>
        resolve((r.result as BackupRecord | undefined) ?? null);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export async function storeBackupRecord(record: BackupRecord | null) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      if (record) store.put(record, "linked-file");
      else store.delete("linked-file");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function writeFileBackup(
  handle: BackupHandle,
  state: AppState,
  lastRevision: string,
  allowReplace = false,
  expectedFingerprint?: string,
): Promise<BackupRecord> {
  if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted")
    throw new Error(
      "Dateizugriff bitte erneut freigeben. Deine Einträge bleiben im Browser gespeichert.",
    );
  if (!allowReplace) {
    const file = await handle.getFile();
    if (file.size > 0) {
      let existing: AppState;
      try {
        if (file.size > 15 * 1024 * 1024) throw new Error("Datei zu groß.");
        existing = parseImport(await file.text());
      } catch {
        throw new Error(
          "Die Sicherungsdatei wurde außerhalb der App verändert oder ist ungültig. Automatische Sicherung angehalten.",
        );
      }
      if (
        (existing.revision !== lastRevision &&
          existing.revision !== state.revision) ||
        (expectedFingerprint &&
          (await backupFingerprint(existing)) !== expectedFingerprint)
      )
        throw new Error(
          "Die Sicherungsdatei wurde außerhalb der App geändert. Automatische Sicherung angehalten; bitte zuerst prüfen.",
        );
    }
  }
  const lastFingerprint = await backupFingerprint(state);
  const writable = await handle.createWritable();
  try {
    await writable.write(jsonExport(state));
    await writable.close();
  } catch (e) {
    await writable.abort?.().catch(() => {});
    throw e;
  }
  return {
    handle,
    lastRevision: state.revision,
    lastSavedAt: new Date().toISOString(),
    lastFingerprint,
  };
}
