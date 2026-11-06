import { useState } from "react";
import type { AppState } from "../types";
import { Dialog } from "../components/Dialog";
import { Field } from "../components/Fields";
import { countConflicts, jsonExport, mergeStates } from "../utils/importExport";
import { downloadFile } from "../utils/calendar";
export function ImportDialog({
  current,
  incoming,
  onClose,
  onImport,
}: {
  current: AppState;
  incoming: AppState;
  onClose: () => void;
  onImport: (s: AppState) => void;
}) {
  const [mode, setMode] = useState("merge");
  const [choice, setChoice] = useState<"" | "keep" | "incoming">("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const count = countConflicts(current, incoming);
  return (
    <Dialog
      title="Backup importieren"
      subtitle="Prüfe den Inhalt, bevor du deine Daten änderst."
      onClose={onClose}
    >
      <div className="import-summary">
        <div>
          <strong>{incoming.injections.length}</strong>
          <span>Injektionen</span>
        </div>
        <div>
          <strong>{incoming.weights.length}</strong>
          <span>Gewichte</span>
        </div>
        <div>
          <strong>{incoming.episodes.length}</strong>
          <span>Episoden</span>
        </div>
      </div>
      <Field label="Wie möchtest du importieren?">
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setConfirmed(false);
          }}
        >
          <option value="merge">
            Mit vorhandenen Einträgen zusammenführen
          </option>
          <option value="replace">Vorhandene Daten vollständig ersetzen</option>
        </select>
      </Field>
      {mode === "merge" && (
        <p className="field-hint">
          Das bestehende Profil und der aktive Zeitplan bleiben erhalten.
          Identische IDs werden nicht doppelt angelegt.
        </p>
      )}
      {mode === "merge" && count > 0 && (
        <Field label={`${count} ID-Konflikte: Welche Version soll gelten?`}>
          <select
            required
            value={choice}
            onChange={(e) => setChoice(e.target.value as typeof choice)}
          >
            <option value="">Bitte bewusst auswählen</option>
            <option value="keep">Bestehende Einträge behalten</option>
            <option value="incoming">Importierte Versionen übernehmen</option>
          </select>
        </Field>
      )}
      {mode === "replace" && (
        <div className="info-box">
          Dein derzeitiges Profil und alle Einträge werden ersetzt.{" "}
          <button
            className="text-button"
            onClick={() =>
              downloadFile(
                "Tagebuch-vor-Import.json",
                jsonExport(current),
                "application/json",
              )
            }
          >
            Vorher Backup herunterladen
          </button>
        </div>
      )}
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>
          Ich habe die Auswahl geprüft und möchte den Import ausführen.
        </span>
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button secondary" onClick={onClose}>
          Abbrechen
        </button>
        <button
          className="button primary"
          disabled={!confirmed || (mode === "merge" && count > 0 && !choice)}
          onClick={() => {
            try {
              onImport(
                mode === "replace"
                  ? incoming
                  : mergeStates(current, incoming, choice || undefined),
              );
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Import fehlgeschlagen.",
              );
            }
          }}
        >
          Import bestätigen
        </button>
      </div>
    </Dialog>
  );
}
