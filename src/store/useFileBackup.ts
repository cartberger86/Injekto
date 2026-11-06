import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState } from "../types";
import {
  backupFingerprint,
  readBackupRecord,
  storeBackupRecord,
  writeFileBackup,
} from "../utils/fileBackup";
import type { BackupHandle, BackupRecord } from "../utils/fileBackup";
import { parseImport } from "../utils/importExport";
type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<BackupHandle>;
};
export function useFileBackup(state: AppState, blocked: boolean) {
  const current = useRef(state);
  current.current = state;
  const record = useRef<BackupRecord | null>(null);
  const generation = useRef(0);
  const queue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [linked, setLinked] = useState(false);
  const [filename, setFilename] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(false);
  const supported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof (window as SavePickerWindow).showSaveFilePicker === "function";
  const report = (e: unknown) => {
    setProblem(true);
    setMessage(
      e instanceof Error
        ? e.message
        : "Dateisicherung fehlgeschlagen. Die Browserdaten bleiben erhalten.",
    );
  };
  useEffect(() => {
    let stopped = false;
    void readBackupRecord()
      .then((r) => {
        if (stopped) return;
        record.current = r;
        if (r) {
          setLinked(true);
          setFilename(r.handle.name);
          setSavedAt(r.lastSavedAt);
          setMessage("Verknüpfte Sicherung gefunden.");
        }
        setReady(true);
      })
      .catch(() => {
        if (!stopped) {
          setReady(true);
          setMessage(
            "Dateiverknüpfungen werden in diesem Browser möglicherweise nur für diese Sitzung behalten.",
          );
        }
      });
    return () => {
      stopped = true;
    };
  }, []);
  const saveCurrent = useCallback((snapshot: AppState, force = false) => {
    const token = generation.current;
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        const r = record.current;
        if (!r || token !== generation.current || !snapshot.profile) return;
        setBusy(true);
        try {
          const next = await writeFileBackup(
            r.handle,
            snapshot,
            r.lastRevision,
            force,
            r.lastFingerprint,
          );
          if (token !== generation.current) return;
          record.current = next;
          setSavedAt(next.lastSavedAt);
          setProblem(false);
          setMessage("Sicherungsdatei automatisch aktualisiert.");
          try {
            await storeBackupRecord(next);
          } catch {
            setMessage(
              "Datei gesichert. Die Verknüpfung konnte nur für diese Sitzung gespeichert werden.",
            );
          }
        } catch (e) {
          if (token === generation.current) report(e);
        } finally {
          setBusy(false);
        }
      });
    return queue.current;
  }, []);
  useEffect(() => {
    if (ready && record.current && !blocked && state.profile)
      void saveCurrent(state);
  }, [ready, state, blocked, saveCurrent]);
  async function connect() {
    if (!supported || !current.current.profile) return;
    try {
      const handle = await (window as SavePickerWindow).showSaveFilePicker!({
        suggestedName: "Injekto-log-Sicherung.json",
        types: [
          {
            description: "Injekto-log Datensicherung",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const file = await handle.getFile();
      if (
        file.size &&
        !confirm(
          "Diese Datei enthält bereits Daten. Mit dem aktuellen Tagebuch aus diesem Browser ersetzen?",
        )
      )
        return;
      generation.current++;
      record.current = { handle, lastRevision: "", lastSavedAt: "" };
      setLinked(true);
      setFilename(handle.name);
      setProblem(false);
      await saveCurrent(current.current, true);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      report(e);
    }
  }
  async function resume() {
    const r = record.current;
    if (!r) return;
    try {
      if (
        (await r.handle.requestPermission({ mode: "readwrite" })) !== "granted"
      )
        throw new Error("Der Dateizugriff wurde nicht freigegeben.");
      const f = await r.handle.getFile();
      let differs = false;
      try {
        const data = parseImport(await f.text());
        differs =
          (data.revision !== r.lastRevision &&
            data.revision !== current.current.revision) ||
          !!(
            r.lastFingerprint &&
            (await backupFingerprint(data)) !== r.lastFingerprint
          );
      } catch {
        differs = f.size > 0;
      }
      if (
        differs &&
        !confirm(
          "Die Sicherungsdatei wurde außerhalb der App geändert. Mit dem aktuellen Browserstand überschreiben? Zum Übernehmen der Datei stattdessen zuerst „Sicherung zum Import öffnen“ wählen.",
        )
      )
        return;
      await saveCurrent(current.current, differs || !f.size);
    } catch (e) {
      report(e);
    }
  }
  async function disconnect() {
    generation.current++;
    record.current = null;
    setLinked(false);
    setFilename("");
    setSavedAt("");
    setProblem(false);
    setMessage(
      "Dateiverknüpfung getrennt. Die Sicherungsdatei bleibt erhalten.",
    );
    try {
      await storeBackupRecord(null);
    } catch {
      report(
        new Error(
          "Verknüpfung für diese Sitzung getrennt. Dauerhafte Browserverknüpfung konnte nicht entfernt werden.",
        ),
      );
    }
  }
  async function readFile() {
    const r = record.current;
    if (!r) throw new Error("Keine Sicherungsdatei verknüpft.");
    return parseImport(await (await r.handle.getFile()).text());
  }
  return {
    supported,
    linked,
    filename,
    savedAt,
    message,
    problem,
    busy,
    ready,
    connect,
    resume,
    disconnect,
    readFile,
  };
}
export type FileBackupController = ReturnType<typeof useFileBackup>;
