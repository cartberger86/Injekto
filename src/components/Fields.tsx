import type { ReactNode } from "react";
import { getSubstance, SUBSTANCES } from "../data/substances";
import type { Schedule, TreatmentMetadata } from "../types";
import { newId } from "../utils/id";
import { isCustomSubstance, treatmentSubstance } from "../utils/treatment";
import { localInput, localToISO } from "../utils/time";
export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}
export function ProductFields({
  value,
  study,
  onChange,
}: {
  value: TreatmentMetadata;
  study: boolean;
  onChange: (value: TreatmentMetadata) => void;
}) {
  const custom = isCustomSubstance(value.substanceId);
  const substance = treatmentSubstance(value);
  const known = custom ? null : getSubstance(value.substanceId);
  return (
    <>
      <div className="form-grid">
        <Field label="Wirkstoff">
          <select
            value={custom ? "custom" : value.substanceId}
            onChange={(e) => {
              if (e.target.value === "custom")
                onChange({
                  substanceId: "custom:" + newId(),
                  productId: "custom",
                  customSubstanceName: "",
                  customProductName: "",
                });
              else {
                const next = getSubstance(e.target.value);
                onChange({
                  substanceId: next.id,
                  productId: next.products[0].id,
                });
              }
            }}
          >
            {SUBSTANCES.filter(
              (x) => !x.study || study || x.id === value.substanceId,
            ).map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
                {x.study ? " · Studienoption" : ""}
              </option>
            ))}
            <option value="custom">Anderer Wirkstoff (Freitext)</option>
          </select>
        </Field>
        <Field label="Präparat">
          <select
            value={value.productId}
            onChange={(e) =>
              onChange({
                ...value,
                productId: e.target.value,
                customProductName: e.target.value === "custom" ? "" : undefined,
              })
            }
          >
            {known?.products.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
                {p.region ? " · " + p.region : ""}
              </option>
            ))}
            <option value="custom">Eigene Bezeichnung (Freitext)</option>
          </select>
        </Field>
      </div>
      {custom && (
        <Field label="Eigener Wirkstoffname">
          <input
            required
            maxLength={160}
            value={value.customSubstanceName ?? ""}
            onChange={(e) =>
              onChange({ ...value, customSubstanceName: e.target.value })
            }
            placeholder="Wirkstoffname eingeben"
          />
        </Field>
      )}
      {value.productId === "custom" && (
        <>
          <Field
            label="Eigene Präparatebezeichnung"
            help="Eine persönliche Bezeichnung, keine Prüfung oder Bestätigung des Produkts."
          >
            <input
              required
              maxLength={160}
              value={value.customProductName ?? ""}
              onChange={(e) =>
                onChange({ ...value, customProductName: e.target.value })
              }
              placeholder="PeptidManufractur"
            />
          </Field>
          <p className="field-hint">
            Die Wirkstoffzuordnung beruht auf deiner Eingabe. Daraus folgt keine
            Aussage über Inhalt, Reinheit oder Zulassung.
          </p>
        </>
      )}
      {custom && (
        <details className="custom-model-details">
          <summary>Modellrechnung optional hinterlegen</summary>
          <p className="field-hint">
            Ohne hinterlegte Halbwertszeit wird ausschließlich protokolliert. Es
            werden keine Werte aus dem Namen abgeleitet.
          </p>
          <Field
            label="Halbwertszeit in Stunden (optional)"
            help="Eigene Angabe, fachlich nicht durch die App geprüft."
          >
            <input
              type="number"
              step="any"
              min="0.001"
              value={value.customHalfLifeHours ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  customHalfLifeHours: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </Field>
          <Field label="Quelle der eigenen Angabe (optional)">
            <input
              maxLength={1000}
              value={value.customHalfLifeSource ?? ""}
              onChange={(e) =>
                onChange({ ...value, customHalfLifeSource: e.target.value })
              }
            />
          </Field>
        </details>
      )}
      {substance.study && (
        <p className="info-box">
          In klinischer Prüfung; nicht zugelassen. Ausschließlich zur
          Dokumentation tatsächlich im Studienkontext erhaltener Gaben. Keine
          zugelassenen Dosierungsstufen.
        </p>
      )}
      <p className="field-hint">
        {substance.halfLife === null
          ? "Keine Halbwertszeit hinterlegt · Tagebuch ohne Modellrechnung"
          : `Halbwertszeit ca. ${substance.halfLife} Stunden · ${custom ? "eigene, ungeprüfte Modellangabe" : "ausschließlich Modellinformation"}`}
      </p>
    </>
  );
}
export function ScheduleFields({
  value,
  onChange,
  zone,
}: {
  value: Schedule;
  onChange: (s: Schedule) => void;
  zone: string;
}) {
  const calendar =
    value.mode === "calendar"
      ? value
      : {
          mode: "calendar" as const,
          cadence: "weekly" as const,
          time: "18:00",
          weekday: 1,
          zone,
          anchor: new Date().toISOString(),
          skipped: [],
        };
  return (
    <div className="schedule-fields">
      <Field
        label="Mein eingetragener Zeitplan"
        help="Trage ausschließlich das ärztlich festgelegte Intervall ein."
      >
        <select
          value={value.mode}
          onChange={(e) =>
            onChange(
              e.target.value === "none"
                ? { mode: "none" }
                : e.target.value === "interval"
                  ? { mode: "interval", hours: 168 }
                  : calendar,
            )
          }
        >
          <option value="none">Kein Zeitplan eingetragen</option>
          <option value="interval">Abstand seit letzter Injektion</option>
          <option value="calendar">Feste lokale Kalenderzeit</option>
        </select>
      </Field>
      {value.mode === "none" ? (
        <p className="field-hint">
          Kein Termin wird berechnet. Injektionen lassen sich unabhängig davon
          dokumentieren.
        </p>
      ) : value.mode === "interval" ? (
        <Field
          label="Abstand in Stunden"
          help="24 Stunden = 1 Tag · 168 Stunden = 7 Tage"
        >
          <input
            type="number"
            min="0.01"
            step="any"
            required
            value={value.hours}
            onChange={(e) =>
              onChange({ ...value, hours: Number(e.target.value) })
            }
          />
        </Field>
      ) : (
        <>
          <div className="form-grid">
            <Field label="Wiederholung">
              <select
                value={value.cadence}
                onChange={(e) =>
                  onChange({
                    ...value,
                    cadence: e.target.value as "daily" | "weekly",
                  })
                }
              >
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
              </select>
            </Field>
            {value.cadence === "weekly" && (
              <Field label="Wochentag">
                <select
                  value={value.weekday}
                  onChange={(e) =>
                    onChange({ ...value, weekday: Number(e.target.value) })
                  }
                >
                  {[
                    "Montag",
                    "Dienstag",
                    "Mittwoch",
                    "Donnerstag",
                    "Freitag",
                    "Samstag",
                    "Sonntag",
                  ].map((d, i) => (
                    <option value={i + 1} key={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Lokale Uhrzeit">
              <input
                type="time"
                value={value.time}
                required
                onChange={(e) => onChange({ ...value, time: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Zeitplan beginnt ab" help={"Zeitzone: " + value.zone}>
            <input
              type="datetime-local"
              value={localInput(value.anchor, value.zone)}
              required
              onChange={(e) => {
                try {
                  onChange({
                    ...value,
                    anchor: localToISO(e.target.value, value.zone),
                  });
                  e.target.setCustomValidity("");
                } catch {
                  e.target.setCustomValidity(
                    "Nicht eindeutige oder ungültige Uhrzeit.",
                  );
                }
              }}
            />
          </Field>
          <p className="field-hint">
            Die lokale Uhrzeit bleibt erhalten. Bei einer übersprungenen Stunde
            wird der Termin nach vorn verschoben, bei einer doppelten Stunde
            zählt das erste Auftreten.
          </p>
        </>
      )}
    </div>
  );
}
