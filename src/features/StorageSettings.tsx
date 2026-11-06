import { useEffect, useState } from "react";
import { FolderSync, ShieldCheck, Unplug } from "lucide-react";
import type { FileBackupController } from "../store/useFileBackup";
import type { AppState } from "../types";
import { fmtDate } from "../utils/time";
export function StorageSettings({
  backup,
  onImport,
  onNotify,
}: {
  backup: FileBackupController;
  onImport: (s: AppState) => void;
  onNotify: (message: string) => void;
}) {
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    void navigator.storage
      ?.persisted?.()
      .then(setPersistent)
      .catch(() => setPersistent(null));
  }, []);
  async function protect() {
    setChecking(true);
    try {
      const granted = await navigator.storage.persist();
      setPersistent(granted);
      onNotify(
        granted
          ? "Dauerhafter Browserspeicher wurde gewährt."
          : "Der Browser hat dauerhaften Speicher nicht gewährt. Regelmäßige Dateisicherungen bleiben wichtig.",
      );
    } catch {
      onNotify("Dauerhafter Speicher ist in diesem Browser nicht verfügbar.");
    } finally {
      setChecking(false);
    }
  }
  return (
    <section className="panel storage-panel">
      <div className="inline-items">
        <FolderSync size={21} />
        <h2>Zusätzlich automatisch sichern</h2>
      </div>
      <p>
        Dein Tagebuch wird bei jeder bestätigten Änderung automatisch im Browser
        gespeichert. Auf unterstützten Geräten kannst du zusätzlich eine Datei
        koppeln, die nach Änderungen aktualisiert wird.
      </p>
      <div className="storage-status">
        <span className="live-dot" />
        <div>
          <strong>Automatische Browserspeicherung aktiv</strong>
          <small>
            {persistent === true
              ? "Dauerhafter Speicher wurde vom Browser gewährt."
              : "Browserdaten können gelöscht werden. Eine zusätzliche Datei schützt vor Datenverlust."}
          </small>
        </div>
      </div>
      {typeof navigator.storage?.persist === "function" &&
        persistent !== true && (
          <button
            className="button secondary full"
            disabled={checking}
            onClick={() => void protect()}
          >
            <ShieldCheck size={17} /> Browserspeicher gegen automatische
            Bereinigung schützen
          </button>
        )}
      {backup.linked ? (
        <div className="linked-backup">
          <strong>{backup.filename}</strong>
          {backup.savedAt && (
            <p>Zuletzt gesichert: {fmtDate(backup.savedAt)}</p>
          )}
          <p
            role="status"
            className={backup.problem ? "backup-warning" : "field-hint"}
          >
            {backup.busy
              ? "Sicherungsdatei wird aktualisiert …"
              : backup.message}
          </p>
          <div className="stack-buttons">
            <button
              className="button secondary"
              disabled={backup.busy}
              onClick={() => void backup.resume()}
            >
              Dateizugriff freigeben / jetzt sichern
            </button>
            <button
              className="button subtle"
              onClick={async () => {
                try {
                  onImport(await backup.readFile());
                } catch (e) {
                  onNotify(
                    e instanceof Error
                      ? e.message
                      : "Sicherung konnte nicht gelesen werden.",
                  );
                }
              }}
            >
              Sicherung zum Import öffnen
            </button>
            <button
              className="text-button"
              onClick={() => void backup.disconnect()}
            >
              <Unplug size={15} /> Dateiverknüpfung trennen
            </button>
          </div>
        </div>
      ) : backup.supported ? (
        <button
          className="button primary full"
          disabled={!backup.ready || backup.busy}
          onClick={() => void backup.connect()}
        >
          <FolderSync size={17} /> Sicherungsdatei verknüpfen
        </button>
      ) : (
        <p className="info-box">
          Die direkte Dateiverknüpfung wird von diesem Browser nicht
          unterstützt. Sie ist vor allem in Desktop-Chrome und -Edge verfügbar.
          Automatische Browserspeicherung und manuelle Backups funktionieren
          weiterhin.
        </p>
      )}
      <p className="tiny">
        Die Sicherungsdatei enthält Gesundheitsdaten ohne zusätzliche
        Verschlüsselung. Den Speicherort wählst du selbst. Nach einem Neustart
        kann der Browser erneut eine Freigabe verlangen. Automatische
        Dateisicherung funktioniert bei geöffneter App und erlaubtem Zugriff.
        Keine geräteübergreifende Synchronisierung.
      </p>
      <p className="tiny">
        Gewährter dauerhafter Speicher schützt vor automatischer Bereinigung,
        nicht vor bewusstem Löschen von Browserdaten. Wenn du die Verknüpfung
        trennst oder die App zurücksetzt, bleibt die gewählte Datei bestehen.
      </p>
    </section>
  );
}
