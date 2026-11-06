import { newId } from "../utils/id";
import { useState } from "react";
import type { FormEvent } from "react";
import { Check, MapPin } from "lucide-react";
import type { AppState, Episode, Injection, Weight } from "../types";
import { treatmentProduct, metadataOf } from "../utils/treatment";
import { Field } from "../components/Fields";
import { Dialog } from "../components/Dialog";
import {
  fmtDate,
  fmtNum,
  isoNow,
  localInput,
  localToISO,
  numberInput,
  validatePast,
} from "../utils/time";
export function EntryForm({
  kind,
  episode,
  state,
  entry,
  onClose,
  onSave,
}: {
  kind: "injection" | "weight";
  episode: Episode;
  state: AppState;
  entry?: Injection | Weight;
  onClose: () => void;
  onSave: (next: AppState) => void;
}) {
  const zone = state.profile!.zone;
  const injections = state.injections
    .filter((i) => i.episodeId === episode.id)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const last = injections[0];
  const previous =
    kind === "injection"
      ? last?.mg
      : state.weights.toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at))[0]
          ?.kg;
  const [date, setDate] = useState(localInput(entry?.at ?? Date.now(), zone));
  const [value, setValue] = useState(
    entry
      ? "mg" in entry
        ? String(entry.mg)
        : String(entry.kg)
      : kind === "injection" && previous
        ? String(previous)
        : "",
  );
  const existing = entry && "mg" in entry ? entry : undefined;
  const [site, setSite] = useState(existing?.site ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [effects, setEffects] = useState(existing?.effects ?? "");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const product = treatmentProduct(existing ?? episode);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    try {
      const at = localToISO(date, zone);
      validatePast(at);
      const n = numberInput(value);
      const now = isoNow();
      const base = {
        id: entry?.id ?? newId(),
        at,
        createdAt: entry?.createdAt ?? now,
        updatedAt: now,
      };
      if (kind === "weight") {
        const w: Weight = { ...base, kg: n };
        setBusy(true);
        onSave({
          ...state,
          weights: [...state.weights.filter((x) => x.id !== entry?.id), w],
        });
      } else {
        if (
          Date.parse(at) < Date.parse(episode.start) ||
          (episode.end && Date.parse(at) >= Date.parse(episode.end))
        )
          throw new Error(
            "Der Zeitpunkt muss innerhalb der ausgewählten Behandlungsepisode liegen.",
          );
        const i: Injection = {
          ...base,
          ...metadataOf(existing ?? episode),
          episodeId: episode.id,
          substanceId: episode.substanceId,
          productId: existing?.productId ?? episode.productId,
          mg: n,
          site,
          note,
          effects,
        };
        setBusy(true);
        onSave({
          ...state,
          injections: [
            ...state.injections.filter((x) => x.id !== entry?.id),
            i,
          ],
        });
      }
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  }
  return (
    <Dialog
      title={
        entry
          ? "Eintrag bearbeiten"
          : kind === "injection"
            ? "Injektion dokumentieren"
            : "Gewicht eintragen"
      }
      subtitle={
        kind === "injection"
          ? product.name + " · tatsächliche Gabe dokumentieren"
          : "Ein Wiegemoment, unabhängig von deiner Injektion."
      }
      onClose={onClose}
      dirty={dirty}
    >
      <form onSubmit={submit} onChangeCapture={() => setDirty(true)}>
        <Field label="Datum und Uhrzeit" help={zone}>
          <input
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field
          label={
            kind === "injection" ? "Dokumentierte Dosis in mg" : "Gewicht in kg"
          }
        >
          <input
            autoFocus
            inputMode="decimal"
            required
            value={value}
            placeholder={kind === "injection" ? "z. B. 2,5" : "z. B. 85,4"}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        {kind === "injection" && (
          <>
            {product.doses.length > 0 && (
              <>
                <div className="chips">
                  {product.doses.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={
                        "chip " +
                        (Number(value.replace(",", ".")) === d
                          ? "selected"
                          : "")
                      }
                      onClick={() => {
                        setValue(String(d));
                        setDirty(true);
                      }}
                    >
                      {fmtNum(d, 2)} mg
                    </button>
                  ))}
                </div>
                <p className="field-hint">
                  Eingabehilfen zur Dokumentation, keine Dosierungsempfehlung.
                </p>
              </>
            )}
            {last?.site && (
              <div className="site-info">
                <MapPin size={16} />
                <span>
                  Zuletzt: <strong>{last.site}</strong> ·{" "}
                  {fmtDate(last.at, zone, false)}
                </span>
              </div>
            )}
            <Field label="Injektionsstelle (optional)">
              <select value={site} onChange={(e) => setSite(e.target.value)}>
                <option value="">Keine Angabe</option>
                {[
                  "Bauch links",
                  "Bauch rechts",
                  "Oberschenkel links",
                  "Oberschenkel rechts",
                  "Oberarm links",
                  "Oberarm rechts",
                  "Andere Stelle",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Notiz (optional)">
              <textarea
                rows={2}
                value={note}
                maxLength={10000}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <Field
              label="Nebenwirkungen (optional)"
              help="Freitext für dein Protokoll; keine automatische Bewertung."
            >
              <textarea
                rows={2}
                value={effects}
                maxLength={10000}
                onChange={(e) => setEffects(e.target.value)}
              />
            </Field>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              if (!dirty || confirm("Eingaben verwerfen?")) onClose();
            }}
          >
            Abbrechen
          </button>
          <button className="button primary" disabled={busy}>
            <Check size={18} />
            {entry ? "Änderungen speichern" : "Eintrag speichern"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
