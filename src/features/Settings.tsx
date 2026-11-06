import { newId } from "../utils/id";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Download,
  Upload,
  ArrowRightLeft,
  Trash2,
  Check,
  ShieldCheck,
} from "lucide-react";
import type { AppState, Episode, Schedule, TreatmentMetadata } from "../types";
import { Dialog } from "../components/Dialog";
import { StorageSettings } from "./StorageSettings";
import type { FileBackupController } from "../store/useFileBackup";
import { Field, ProductFields, ScheduleFields } from "../components/Fields";
import {
  isCustomSubstance,
  metadataOf,
  sameModel,
  treatmentSubstance,
  treatmentProduct,
  validateTreatment,
} from "../utils/treatment";
import { csvExport, jsonExport, parseImport } from "../utils/importExport";
import { downloadFile } from "../utils/calendar";
import {
  isoNow,
  localDate,
  localInput,
  localToISO,
  numberInput,
  validatePast,
} from "../utils/time";
export function Settings({
  state,
  onSave,
  onReset,
  onImport,
  onNotify,
  backup,
}: {
  state: AppState;
  onSave: (s: AppState) => void;
  onReset: () => void;
  onImport: (s: AppState) => void;
  onNotify: (s: string) => void;
  backup: FileBackupController;
}) {
  const p = state.profile!;
  const active = state.episodes.find((e) => e.id === p.activeEpisodeId)!;
  const file = useRef<HTMLInputElement>(null);
  const [start, setStart] = useState(p.startDate);
  const [kg, setKg] = useState(String(p.startWeight));
  const [goal, setGoal] = useState(
    p.targetWeight ? String(p.targetWeight) : "",
  );
  const [time, setTime] = useState(p.preferredTime);
  const [schedule, setSchedule] = useState<Schedule>(active.schedule);
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (start > localDate(Date.now(), p.zone))
        throw new Error("Startdatum liegt in der Zukunft.");
      const next = {
        ...state,
        profile: {
          ...p,
          startDate: start,
          startWeight: numberInput(kg),
          targetWeight: goal ? numberInput(goal) : undefined,
          preferredTime: time,
        },
        episodes: state.episodes.map((x) =>
          x.id === active.id ? { ...x, schedule, updatedAt: isoNow() } : x,
        ),
      };
      if (
        confirm(
          "Profil und eingetragenen Zeitplan speichern? Historische Injektionen bleiben erhalten.",
        )
      ) {
        onSave(next);
        onNotify("Einstellungen gespeichert.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte Angaben prüfen.");
    }
  }
  return (
    <>
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">PERSÖNLICHE ANGABEN</p>
              <h2>Dein Profil & Zeitplan</h2>
            </div>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Startdatum">
                <input
                  type="date"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field label="Startgewicht in kg">
                <input
                  inputMode="decimal"
                  required
                  value={kg}
                  onChange={(e) => setKg(e.target.value)}
                />
              </Field>
              <Field label="Zielgewicht in kg (optional)">
                <input
                  inputMode="decimal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </Field>
              <Field label="Bevorzugte Uhrzeit">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </Field>
            </div>
            <p className="field-hint">
              Zeitzone: {p.zone} · unabhängig von späteren Geräteeinstellungen
            </p>
            <ScheduleFields
              value={schedule}
              onChange={setSchedule}
              zone={p.zone}
            />
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" type="submit">
              <Check size={17} /> Änderungen speichern
            </button>
          </form>
        </section>
        <div className="settings-aside">
          <StorageSettings
            backup={backup}
            onImport={onImport}
            onNotify={onNotify}
          />
          <section className="panel">
            <p className="eyebrow">AKTUELLE BEHANDLUNG</p>
            <h2>{treatmentProduct(active).name}</h2>
            <p>
              {treatmentSubstance(active).name} ·{" "}
              {treatmentSubstance(active).halfLife === null
                ? "ohne Modellrechnung"
                : `Halbwertszeit ca. ${treatmentSubstance(active).halfLife} h`}
              {treatmentSubstance(active).custom ? " · eigene Angabe" : ""}
            </p>
            <button
              className="button secondary full"
              onClick={() => setSwitching(true)}
            >
              <ArrowRightLeft size={17} /> Behandlung / Präparat ändern
            </button>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={p.studyEnabled}
                disabled={active.substanceId === "retatrutide"}
                onChange={(e) => {
                  try {
                    onSave({
                      ...state,
                      profile: { ...p, studyEnabled: e.target.checked },
                    });
                  } catch (e) {
                    onNotify(
                      e instanceof Error
                        ? e.message
                        : "Speichern fehlgeschlagen.",
                    );
                  }
                }}
              />
              <span>Studienoption Retatrutid anzeigen</span>
            </label>
            <p className="field-hint">
              In klinischer Prüfung; nicht zugelassen.
            </p>
          </section>
          <section className="panel">
            <p className="eyebrow">DEINE DATEN</p>
            <h2>Sichern & mitnehmen</h2>
            <p>
              Ein Backup ist der einfachste Schutz vor gelöschten Browserdaten.
            </p>
            <div className="stack-buttons">
              <button
                className="button secondary"
                onClick={() =>
                  downloadFile(
                    "Injekto-log-Backup.json",
                    jsonExport(state),
                    "application/json",
                  )
                }
              >
                <Download size={17} /> JSON-Backup exportieren
              </button>
              <button
                className="button secondary"
                onClick={() => file.current?.click()}
              >
                <Upload size={17} /> JSON-Backup importieren
              </button>
              <div className="form-grid">
                <button
                  className="button subtle"
                  onClick={() =>
                    downloadFile(
                      "Gewichte.csv",
                      csvExport(state, "weights"),
                      "text/csv;charset=utf-8",
                    )
                  }
                >
                  Gewichte CSV
                </button>
                <button
                  className="button subtle"
                  onClick={() =>
                    downloadFile(
                      "Injektionen.csv",
                      csvExport(state, "injections"),
                      "text/csv;charset=utf-8",
                    )
                  }
                >
                  Injektionen CSV
                </button>
              </div>
            </div>
            <input
              ref={file}
              hidden
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                try {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 15 * 1024 * 1024)
                    throw new Error("Datei zu groß (max. 15 MB).");
                  onImport(parseImport(await f.text()));
                } catch (e) {
                  onNotify(
                    e instanceof Error ? e.message : "Import fehlgeschlagen.",
                  );
                } finally {
                  if (file.current) file.current.value = "";
                }
              }}
            />
            <p className="tiny">
              Exporte können sensible Gesundheitsdaten enthalten. Bitte
              geschützt aufbewahren.
            </p>
          </section>
          <section className="panel reset-panel">
            <h3>Neu beginnen</h3>
            <p>
              Entfernt ausschließlich die Protokolldaten dieser App aus diesem
              Browser.
            </p>
            <button
              className="button subtle"
              onClick={() => setResetOpen(true)}
            >
              <Trash2 size={17} /> Alle Protokolldaten löschen
            </button>
          </section>
        </div>
      </div>
      <section className="panel privacy-panel">
        <ShieldCheck size={23} />
        <div>
          <h3>Deine Daten bleiben bei dir.</h3>
          <p>
            Die App überträgt deine Protokolle nicht an einen App-Server. Es
            gibt keine automatische Synchronisierung zwischen Geräten.
            Browserdaten können gelöscht werden oder verloren gehen.
            localStorage bietet keine eigene Verschlüsselung oder
            Zugriffssperre.
          </p>
        </div>
      </section>
      {switching && (
        <SwitchDialog
          state={state}
          active={active}
          onClose={() => setSwitching(false)}
          onSave={(s) => {
            onSave(s);
            setSwitching(false);
            onNotify("Behandlung aktualisiert.");
          }}
        />
      )}
      {resetOpen && (
        <Dialog
          title="Alle Protokolldaten löschen?"
          onClose={() => setResetOpen(false)}
        >
          <p>
            Profil, Injektionen und Gewichte werden aus diesem Browser entfernt.
            Das ist nicht rückgängig zu machen. Exportierte Dateien und
            Kalendertermine bleiben bestehen.
          </p>
          <button
            className="button secondary full"
            onClick={() =>
              downloadFile(
                "Tagebuch-vor-Loeschen.json",
                jsonExport(state),
                "application/json",
              )
            }
          >
            <Download size={17} /> Vorher Backup herunterladen
          </button>
          <Field label="Zum Bestätigen LÖSCHEN eingeben">
            <input
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setResetOpen(false)}
            >
              Abbrechen
            </button>
            <button
              className="button primary"
              disabled={resetText !== "LÖSCHEN"}
              onClick={onReset}
            >
              Unwiderruflich löschen
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
function SwitchDialog({
  state,
  active,
  onClose,
  onSave,
}: {
  state: AppState;
  active: Episode;
  onClose: () => void;
  onSave: (s: AppState) => void;
}) {
  const p = state.profile!;
  const [treatment, setTreatment] = useState<TreatmentMetadata>(
    metadataOf(active),
  );
  const [start, setStart] = useState(localInput(Date.now(), p.zone));
  const [schedule, setSchedule] = useState<Schedule>(active.schedule);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const unchangedModel = sameModel(active, treatment);
  function commit() {
    try {
      validateTreatment(treatment);
      const now = isoNow();
      const metadata = metadataOf(treatment);
      if (unchangedModel) {
        onSave({
          ...state,
          episodes: state.episodes.map((e) =>
            e.id === active.id
              ? { ...e, ...metadata, schedule, updatedAt: now }
              : e,
          ),
        });
        return;
      }
      const at = localToISO(start, p.zone);
      validatePast(at);
      if (Date.parse(at) <= Date.parse(active.start))
        throw new Error(
          "Der Wechsel muss nach dem Beginn der bisherigen Episode liegen.",
        );
      if (
        state.injections.some(
          (i) =>
            i.episodeId === active.id && Date.parse(i.at) >= Date.parse(at),
        )
      )
        throw new Error(
          "Nach diesem Zeitpunkt existieren Injektionen der bisherigen Behandlung. Bitte einen späteren Wechselzeitpunkt wählen oder die Einträge prüfen.",
        );
      const id = newId();
      if (
        metadata.substanceId === active.substanceId &&
        isCustomSubstance(metadata.substanceId)
      )
        metadata.substanceId = "custom:" + newId();
      onSave({
        ...state,
        profile: { ...p, activeEpisodeId: id },
        episodes: [
          ...state.episodes.map((e) =>
            e.id === active.id ? { ...e, end: at, updatedAt: now } : e,
          ),
          {
            id,
            ...metadata,
            start: at,
            schedule,
            createdAt: now,
            updatedAt: now,
          },
        ],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Änderung fehlgeschlagen.");
    }
  }
  function reviewSelection() {
    try {
      validateTreatment(treatment);
      setError("");
      setReview(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte Angaben prüfen.");
    }
  }
  return (
    <Dialog
      title="Behandlung ändern"
      subtitle="Historische Einträge behalten ihre ursprünglichen Bezeichnungen."
      onClose={onClose}
      dirty
    >
      <ProductFields
        value={treatment}
        study={p.studyEnabled}
        onChange={(next) => {
          if (next.substanceId !== treatment.substanceId) {
            const hours = treatmentSubstance(next).intervalHours;
            setSchedule(
              next.substanceId === active.substanceId
                ? active.schedule
                : hours
                  ? { mode: "interval", hours }
                  : { mode: "none" },
            );
          }
          setTreatment(next);
          setReview(false);
        }}
      />
      {!unchangedModel && (
        <>
          <p className="info-box">
            Restmengen verschiedener Wirkstoffe sind nicht direkt vergleichbar.
            Ein Wechsel setzt vorhandene Wirkstoffe im Körper nicht auf null.
            Auch geänderte eigene Modellparameter beginnen eine neue Episode.
          </p>
          <Field label="Tatsächlicher Wechselzeitpunkt">
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setReview(false);
              }}
            />
          </Field>
        </>
      )}
      <ScheduleFields
        value={schedule}
        onChange={(s) => {
          setSchedule(s);
          setReview(false);
        }}
        zone={p.zone}
      />
      {unchangedModel && (
        <p className="field-hint">
          Gleicher Wirkstoff und gleiche Modellparameter: Die bestehende Episode
          bleibt erhalten. Frühere Einträge behalten ihre damalige
          Präparatebezeichnung.
        </p>
      )}
      {review && (
        <div className="info-box">
          <strong>Deine Auswahl</strong>
          <p>
            {treatmentProduct(active).name} → {treatmentProduct(treatment).name}
          </p>
          <p>
            {treatmentSubstance(treatment).name}
            {treatmentSubstance(treatment).custom
              ? " · eigene, ungeprüfte Angabe"
              : ""}
          </p>
          <p>
            {unchangedModel
              ? "Präparate-/Zeitplanänderung, keine neue Episode."
              : "Neue Episode ab " + start.replace("T", " · ")}
            <br />
            {schedule.mode === "none"
              ? "Kein Zeitplan eingetragen"
              : schedule.mode === "interval"
                ? `Abstand: ${schedule.hours} Stunden`
                : `${schedule.cadence === "daily" ? "Täglich" : "Wöchentlich"} um ${schedule.time} (${schedule.zone})`}
          </p>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button secondary" onClick={onClose}>
          Abbrechen
        </button>
        <button
          className="button primary"
          onClick={() => (review ? commit() : reviewSelection())}
        >
          {review ? "Änderung bestätigen" : "Auswahl prüfen"}
        </button>
      </div>
    </Dialog>
  );
}
