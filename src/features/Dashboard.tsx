import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Droplets,
  Info,
  Plus,
  Scale,
  Syringe,
  Target,
  TrendingDown,
} from "lucide-react";
import type { AppState, Episode } from "../types";
import { treatmentSubstance, treatmentProduct } from "../utils/treatment";
import { MODEL_NOTICE } from "../config/appInfo";
import { ProgressChart } from "../components/ProgressChart";
import { remaining, relative } from "../utils/model";
import { nextScheduled, projectFuture } from "../utils/schedule";
import { calendarICS, downloadFile } from "../utils/calendar";
import { daysSince, elapsed, fmtDate, fmtNum, HOUR } from "../utils/time";
export function Dashboard({
  state,
  episode,
  setEpisode,
  onAdd,
  onHistory,
  onSave,
  now,
}: {
  state: AppState;
  episode: Episode;
  setEpisode: (id: string) => void;
  onAdd: (k: "injection" | "weight") => void;
  onHistory: () => void;
  onSave: (s: AppState) => void;
  now: number;
}) {
  const p = state.profile!,
    sub = treatmentSubstance(episode);
  const [weeks, setWeeks] = useState(12);
  const [preview, setPreview] = useState(false);
  const [include, setInclude] = useState(false);
  const [modelTable, setModelTable] = useState(false);
  const injections = state.injections
    .filter((i) => i.episodeId === episode.id)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const last = injections[0];
  const latest = state.weights
    .slice()
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  const kg = latest?.kg ?? p.startWeight;
  const diff = kg - p.startWeight;
  const next = nextScheduled(episode.schedule, injections, now);
  const active = episode.id === p.activeEpisodeId;
  const half = sub.halfLife;
  const amount = half === null ? null : remaining(injections, now, half),
    percent = half === null ? null : relative(injections, now, half);
  const assumed = projectFuture(
    episode.schedule,
    injections,
    now,
    now + 14 * 24 * HOUR,
  );
  const canPreview = half !== null && active && assumed.length > 0;
  const sign = diff > 0 ? "+" : "";
  const days = daysSince(p.startDate, p.zone, now);
  return (
    <>
      <div className="overview-label">
        <div className="inline-items">
          <span className="live-dot" />
          <span>{treatmentProduct(episode).name}</span>
          <span className="muted">{sub.name}</span>
          {!active && <span className="count-badge">Frühere Behandlung</span>}
        </div>
        {state.episodes.length > 1 && (
          <label className="episode-picker">
            <span className="sr-only">Behandlungsepisode anzeigen</span>
            <select
              value={episode.id}
              onChange={(e) => {
                setPreview(false);
                setEpisode(e.target.value);
              }}
            >
              {state.episodes.map((e) => (
                <option value={e.id} key={e.id}>
                  {treatmentProduct(e).name} · {fmtDate(e.start, p.zone, false)}
                  {e.id === p.activeEpisodeId ? " · aktiv" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="stat-grid">
        <article className="stat-card featured">
          <div className="stat-label">
            <span>Aktuelles Gewicht</span>
            <Scale size={18} />
          </div>
          <div className="stat-value">
            {fmtNum(kg, 2)}
            <span>kg</span>
          </div>
          <div className="stat-caption">
            {latest
              ? "Zuletzt am " + fmtDate(latest.at, p.zone, false)
              : "Dein hinterlegtes Startgewicht"}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            <span>Seit deinem Start</span>
            <TrendingDown size={18} />
          </div>
          <div className="stat-value">
            {sign}
            {fmtNum(diff, 2)}
            <span>kg</span>
          </div>
          <div className="stat-caption">
            <span className="pill-soft">
              <ArrowDownRight size={13} />
              {sign}
              {fmtNum((diff / p.startWeight) * 100, 1)} %
            </span>
            <span>von {fmtNum(p.startWeight, 2)} kg</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            <span>Dein Weg bisher</span>
            <CalendarDays size={18} />
          </div>
          <div className="stat-value">
            {days}
            <span>{days === 1 ? "Tag" : "Tage"}</span>
          </div>
          <div className="stat-caption">
            Start am {fmtDate(p.startDate + "T12:00:00Z", p.zone, false)}
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            <span>
              {p.targetWeight
                ? "Persönliches Ziel"
                : "Letzte dokumentierte Dosis"}
            </span>
            {p.targetWeight ? <Target size={18} /> : <Syringe size={18} />}
          </div>
          <div className="stat-value">
            {p.targetWeight
              ? fmtNum(p.targetWeight, 2)
              : last
                ? fmtNum(last.mg, 3)
                : "—"}
            <span>{p.targetWeight ? "kg" : last ? "mg" : ""}</span>
          </div>
          <div className="stat-caption">
            {p.targetWeight
              ? "Von dir eingetragen"
              : last
                ? fmtDate(last.at, p.zone)
                : "Noch keine Injektion erfasst"}
          </div>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">VERÄNDERUNGEN SICHTBAR MACHEN</p>
              <h2>Dein Verlauf</h2>
            </div>
            <label>
              <span className="sr-only">Zeitraum des Diagramms</span>
              <select
                className="small-select"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
              >
                <option value={4}>4 Wochen</option>
                <option value={12}>12 Wochen</option>
                <option value={24}>24 Wochen</option>
              </select>
            </label>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-weight" /> Gewicht
            </span>
            {half !== null && (
              <span>
                <i className="legend-model" /> Modellierte Restmenge*
              </span>
            )}
            <span>
              <i className="legend-start" /> Startgewicht
            </span>
          </div>
          <ProgressChart
            state={state}
            episode={episode}
            weeks={weeks}
            preview={preview && canPreview}
            now={now}
          />
          {!last && !latest && (
            <div className="chart-empty-hint">
              Dein erster Eintrag macht den Verlauf sichtbar.
            </div>
          )}
          <div className="chart-bottom">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={preview && canPreview}
                disabled={!canPreview}
                onChange={(e) => setPreview(e.target.checked)}
              />
              <span>
                2 Wochen Modellvorschau{" "}
                <span className="muted">· Annahme, keine Empfehlung</span>
              </span>
            </label>
            <button
              className="text-button"
              onClick={() => setModelTable(!modelTable)}
              aria-expanded={modelTable}
            >
              {modelTable ? "Tabelle schließen" : "Werte als Tabelle"}{" "}
              <ChevronRight size={15} />
            </button>
          </div>
          {!canPreview && (
            <p className="tiny">
              Vorschau erst mit dokumentierter Dosis und zukünftigem, geklärtem
              Termin verfügbar.
            </p>
          )}
          {modelTable && (
            <div className="table-scroll">
              <table>
                <caption>
                  Modellwerte der vergangenen sieben Tage, jeweils zur aktuellen
                  Uhrzeit
                </caption>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Modellierte Restmenge</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    { length: 8 },
                    (_, i) => now - (7 - i) * 24 * HOUR,
                  ).map((t) => (
                    <tr key={t}>
                      <td>{fmtDate(t, p.zone)}</td>
                      <td>
                        {half !== null &&
                        injections.some((i) => Date.parse(i.at) <= t)
                          ? fmtNum(remaining(injections, t, half!), 3) + " mg"
                          : "Keine Berechnung"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="chart-disclaimer">
            * {MODEL_NOTICE} Gewichtsveränderungen belegen keinen ursächlichen
            Zusammenhang.
          </p>
        </section>
        <aside className="dashboard-aside">
          <section className="panel schedule-card">
            <div className="panel-icon">
              <CalendarDays size={20} />
            </div>
            <p className="eyebrow">DEIN EINGETRAGENER ZEITPLAN</p>
            <h2>
              {!active
                ? "Frühere Behandlung"
                : next === null
                  ? "Noch kein Termin"
                  : fmtDate(next, p.zone, false)}
            </h2>
            {active && next !== null ? (
              <>
                <div className="time-large">
                  {new Intl.DateTimeFormat("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: p.zone,
                  }).format(next)}{" "}
                  <span>Uhr</span>
                </div>
                <p className="schedule-status">
                  <Clock3 size={15} />
                  {next > now
                    ? "Noch " + elapsed(next - now)
                    : "Termin laut Zeitplan verstrichen"}
                </p>
                <p className="schedule-explanation">
                  {next <= now
                    ? "Intervall erreicht — nur spritzen, wenn das so verordnet ist."
                    : "Nächster Termin laut eingetragenem Intervall. Keine Aufforderung zur Injektion."}
                </p>
                <button
                  className="button secondary full"
                  onClick={() =>
                    downloadFile(
                      "Persoenlicher-Protokolltermin.ics",
                      calendarICS(
                        next,
                        include && last
                          ? `${treatmentProduct(episode).name}; zuletzt dokumentiert ${fmtNum(last.mg, 3)} mg.`
                          : undefined,
                      ),
                      "text/calendar;charset=utf-8",
                    )
                  }
                >
                  In Kalender eintragen <ArrowRight size={16} />
                </button>
                <label className="checkbox-field tiny">
                  <input
                    type="checkbox"
                    checked={include}
                    onChange={(e) => setInclude(e.target.checked)}
                  />
                  <span>Präparat und letzte Dosis mit exportieren</span>
                </label>
                <p className="tiny">
                  Der Kalenderimport dokumentiert keine Gabe. Daten können beim
                  Kalenderanbieter gespeichert werden.
                </p>
                {episode.schedule.mode === "calendar" && next <= now && (
                  <button
                    className="text-button"
                    onClick={() => {
                      if (
                        !confirm(
                          "Diesen Termin als übersprungen markieren? Es wird keine Injektion gespeichert.",
                        )
                      )
                        return;
                      const schedule = episode.schedule;
                      if (schedule.mode === "calendar")
                        onSave({
                          ...state,
                          episodes: state.episodes.map((e) =>
                            e.id === episode.id
                              ? {
                                  ...e,
                                  schedule: {
                                    ...schedule,
                                    skipped: [
                                      ...schedule.skipped,
                                      new Date(next).toISOString(),
                                    ],
                                  },
                                  updatedAt: new Date().toISOString(),
                                }
                              : e,
                          ),
                        });
                    }}
                  >
                    Termin bewusst überspringen
                  </button>
                )}
              </>
            ) : (
              <p>
                {active
                  ? episode.schedule.mode === "none"
                    ? "Kein Zeitplan eingetragen. Tatsächliche Gaben kannst du unabhängig davon dokumentieren."
                    : "Dokumentiere zuerst eine tatsächlich erfolgte Injektion. Daraus ergibt sich dein nächster Termin."
                  : "Historische Daten bleiben einsehbar. Der aktuelle Zeitplan gehört zur aktiven Behandlung."}
              </p>
            )}
          </section>
          <section className="panel model-card">
            <div className="stat-label">
              <span>Modellierte Restmenge</span>
              <Droplets size={18} />
            </div>
            <div className="model-value">
              {amount !== null && last ? fmtNum(amount, 2) : "—"}
              <span>{last && half !== null ? "mg" : ""}</span>
            </div>
            <p>
              {percent === null
                ? half === null
                  ? "Keine Halbwertszeit hinterlegt"
                  : "Noch keine Berechnung möglich"
                : fmtNum(percent, 1) + " % des Referenzwerts"}
            </p>
            {last && (
              <p className="tiny">
                Seit letzter dokumentierter Injektion:{" "}
                {elapsed(now - Date.parse(last.at))}
              </p>
            )}
            <div className="model-bar" aria-hidden="true">
              <span style={{ width: Math.min(percent ?? 0, 100) + "%" }} />
            </div>
            <p className="tiny">
              {half === null
                ? "Ohne eigene Halbwertszeit werden keine Restmenge und kein relativer Modellwert geschätzt."
                : "Bezogen auf den Modellwert direkt nach der letzten dokumentierten Injektion."}
            </p>
          </section>
        </aside>
      </div>
      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">DOKUMENTIERT, NICHT VERGESSEN</p>
              <h2>Letzte Injektionen</h2>
            </div>
            <button className="text-button" onClick={onHistory}>
              Alle ansehen <ArrowRight size={16} />
            </button>
          </div>
          {injections.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Dosis</th>
                    <th>Injektionsstelle</th>
                  </tr>
                </thead>
                <tbody>
                  {injections.slice(0, 5).map((i) => (
                    <tr key={i.id}>
                      <td>{fmtDate(i.at, p.zone)}</td>
                      <td>
                        <span className="dose-label">{fmtNum(i.mg, 3)} mg</span>
                      </td>
                      <td>{i.site || "Keine Angabe"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state compact">
              <Syringe size={28} />
              <h3>Noch keine Injektion dokumentiert.</h3>
              <p>Eine erfolgte Gabe kannst du hier festhalten.</p>
              <button
                className="text-button"
                onClick={() => onAdd("injection")}
              >
                <Plus size={16} /> Ersten Eintrag anlegen
              </button>
            </div>
          )}
        </section>
        <section className="panel half-life-card">
          <div className="inline-items">
            <Info size={18} />
            <h3>Halbwertszeit verstehen</h3>
          </div>
          {half === null ? (
            <p>
              Für {sub.name} ist keine Halbwertszeit hinterlegt. Die App führt
              dein Tagebuch ohne Modellrechnung fort.
            </p>
          ) : (
            <p>
              Bei {sub.name} näherungsweise{" "}
              <strong>{fmtNum(half / 24, 2)} Tage</strong> ({half} Stunden).{" "}
              {sub.custom ? "Eigene, ungeprüfte Modellangabe." : ""}
            </p>
          )}
          {last && half !== null ? (
            <div className="half-life-steps">
              <div>
                <span className="step-dot" />
                <div>
                  <strong>1 Halbwertszeit</strong>
                  <p>{fmtDate(Date.parse(last.at) + half! * HOUR, p.zone)}</p>
                  <small>Etwa 50 % des Beitrags dieser einzelnen Dosis.</small>
                </div>
              </div>
              <div>
                <span className="step-dot hollow" />
                <div>
                  <strong>5 Halbwertszeiten</strong>
                  <p>
                    {fmtDate(Date.parse(last.at) + 5 * half! * HOUR, p.zone)}
                  </p>
                  <small>
                    Etwa 3,125 % des Beitrags dieser einzelnen Dosis.
                  </small>
                </div>
              </div>
            </div>
          ) : (
            <p className="tiny">
              {half === null
                ? "Es werden keine Abbau- oder Halbwertszeit-Termine aus einem freien Namen abgeleitet."
                : "Zeitmarkierungen erscheinen nach deinem ersten dokumentierten Eintrag."}
            </p>
          )}
          <p className="tiny">
            Weitere Injektionen beeinflussen die Gesamtsumme. Daraus folgt kein
            sicherer Wechsel- oder Injektionstermin.
          </p>
        </section>
      </div>
    </>
  );
}
