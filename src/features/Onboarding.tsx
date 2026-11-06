import { newId } from "../utils/id";
import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import type { AppState, Schedule, TreatmentMetadata } from "../types";
import { Field, ProductFields, ScheduleFields } from "../components/Fields";
import { treatmentSubstance } from "../utils/treatment";
import {
  defaultZone,
  isoNow,
  localDate,
  localToISO,
  numberInput,
} from "../utils/time";
export function Onboarding({
  state,
  onSave,
}: {
  state: AppState;
  onSave: (s: AppState) => void;
}) {
  const zone = defaultZone();
  const [sid, setSid] = useState("tirzepatide");
  const [pid, setPid] = useState("mounjaro");
  const [custom, setCustom] = useState<Partial<TreatmentMetadata>>({});
  const [start, setStart] = useState(localDate());
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [preferred, setPreferred] = useState("18:00");
  const [schedule, setSchedule] = useState<Schedule>({
    mode: "interval",
    hours: 168,
  });
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      if (start > localDate(Date.now(), zone))
        throw new Error("Das Startdatum darf nicht in der Zukunft liegen.");
      const kg = numberInput(weight),
        target = goal ? numberInput(goal) : undefined;
      const now = isoNow();
      const id = newId();
      onSave({
        ...state,
        profile: {
          startDate: start,
          startWeight: kg,
          targetWeight: target,
          preferredTime: preferred,
          zone,
          activeEpisodeId: id,
          studyEnabled: false,
        },
        episodes: [
          {
            id,
            ...custom,
            substanceId: sid,
            productId: pid,
            start: localToISO(start + "T00:00", zone),
            schedule,
            createdAt: now,
            updatedAt: now,
          },
        ],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte Angaben prüfen.");
    }
  }
  return (
    <div className="onboarding-grid">
      <section className="panel onboarding-form">
        <div className="section-heading">
          <span className="step-badge">01</span>
          <div>
            <h2>Dein Tagebuch beginnt hier.</h2>
            <p>Ein paar Angaben für deinen persönlichen Überblick.</p>
          </div>
        </div>
        <form onSubmit={submit}>
          <ProductFields
            value={{ ...custom, substanceId: sid, productId: pid }}
            study={false}
            onChange={(next) => {
              const changed = next.substanceId !== sid;
              setSid(next.substanceId);
              setPid(next.productId);
              setCustom(next);
              if (changed) {
                const hours = treatmentSubstance(next).intervalHours;
                setSchedule(
                  hours ? { mode: "interval", hours } : { mode: "none" },
                );
                if (!hours) setAdvanced(true);
              }
            }}
          />
          <div className="form-grid">
            <Field label="Startdatum">
              <input
                type="date"
                required
                value={start}
                max={localDate()}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Startgewicht in kg">
              <input
                inputMode="decimal"
                placeholder="z. B. 85,4"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </Field>
          </div>
          <button
            type="button"
            className="text-button advanced-toggle"
            aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}
          >
            {advanced ? "Weniger Angaben" : "Zielgewicht und Zeitplan ergänzen"}{" "}
            <span>{advanced ? "−" : "+"}</span>
          </button>
          {advanced && (
            <div className="advanced-fields">
              <div className="form-grid">
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
                    value={preferred}
                    onChange={(e) => setPreferred(e.target.value)}
                  />
                </Field>
              </div>
              <ScheduleFields
                value={schedule}
                onChange={setSchedule}
                zone={zone}
              />
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full" type="submit">
            Tagebuch anlegen <ArrowRight size={18} />
          </button>
          <p className="tiny centered">
            <ShieldCheck size={14} /> Deine Protokolle bleiben in diesem
            Browser.
          </p>
        </form>
      </section>
      <aside className="onboarding-aside">
        <div className="intro-art" aria-hidden="true">
          <div className="art-orbit one" />
          <div className="art-orbit two" />
          <div className="art-icon">
            <Sparkles size={38} />
          </div>
          <span className="art-dot dot-one" />
          <span className="art-dot dot-two" />
          <span className="art-label">Schritt für Schritt.</span>
        </div>
        <p className="eyebrow">WENIGER IM KOPF. MEHR IM BLICK.</p>
        <h2>
          Ein Platz für
          <br />
          deinen Verlauf.
        </h2>
        <p>
          Dokumentiere, was war. Behalte Veränderungen im Blick. In deinem
          Tempo.
        </p>
        <ul className="benefits">
          {[
            "Injektionen und Gewicht getrennt erfassen",
            "Deinen Verlauf verständlich darstellen",
            "Lokal speichern und jederzeit exportieren",
          ].map((t) => (
            <li key={t}>
              <span>
                <Check size={15} />
              </span>
              {t}
            </li>
          ))}
        </ul>
        <div className="quiet-note">
          Du legst zunächst dein Profil an. Eine Injektion wird erst
          gespeichert, wenn du sie selbst dokumentierst.
        </div>
      </aside>
    </div>
  );
}
