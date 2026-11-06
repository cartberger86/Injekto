import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";
import type { AppState, Episode, Injection, Weight } from "../types";
import {
  treatmentSubstance,
  treatmentProduct,
  validateTreatment,
} from "./treatment";
import { fmtNum } from "./time";
const id = z.string().min(1).max(160);
const iso = z
  .string()
  .refine(
    (v) =>
      /T/.test(v) &&
      /(Z|[+-]\d{2}:\d{2})$/.test(v) &&
      Number.isFinite(Date.parse(v)),
    "Ungültiger absoluter Zeitstempel.",
  );
const positive = z.number().finite().positive();
const zone = z.string().refine((v) => {
  try {
    Temporal.Now.zonedDateTimeISO(v);
    return true;
  } catch {
    return false;
  }
}, "Ungültige Zeitzone.");
const day = z.string().refine((v) => {
  try {
    return Temporal.PlainDate.from(v).toString() === v;
  } catch {
    return false;
  }
}, "Ungültiges Kalenderdatum.");
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const schedule = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("none") }).strict(),
  z.object({ mode: z.literal("interval"), hours: positive }).strict(),
  z
    .object({
      mode: z.literal("calendar"),
      cadence: z.enum(["daily", "weekly"]),
      time: clock,
      weekday: z.number().int().min(1).max(7),
      zone,
      anchor: iso,
      skipped: z.array(iso).max(100000),
    })
    .strict(),
]);
const common = { id, createdAt: iso, updatedAt: iso };
const treatment = {
  substanceId: id,
  productId: id,
  customSubstanceName: z.string().trim().min(1).max(160).optional(),
  customProductName: z.string().trim().min(1).max(160).optional(),
  customHalfLifeHours: positive.optional(),
  customHalfLifeSource: z.string().max(1000).optional(),
};
const profile = z
  .object({
    startDate: day,
    startWeight: positive,
    targetWeight: positive.optional(),
    preferredTime: clock,
    zone,
    activeEpisodeId: id,
    studyEnabled: z.boolean(),
  })
  .strict();
export const stateSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: id,
    updatedAt: iso,
    profile: profile.nullable(),
    episodes: z
      .array(
        z
          .object({
            ...common,
            ...treatment,
            start: iso,
            end: iso.optional(),
            schedule,
          })
          .strict(),
      )
      .max(10000),
    injections: z
      .array(
        z
          .object({
            ...common,
            episodeId: id,
            ...treatment,
            at: iso,
            mg: positive,
            site: z.string().max(300),
            note: z.string().max(10000),
            effects: z.string().max(10000),
          })
          .strict(),
      )
      .max(100000),
    weights: z
      .array(z.object({ ...common, at: iso, kg: positive }).strict())
      .max(100000),
  })
  .strict();
export function validateState(input: unknown, now = Date.now()): AppState {
  const result = stateSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Datei entspricht nicht dem unterstützten Datenformat (Version 1). " +
        result.error.issues[0]?.message,
    );
  const state = result.data;
  for (const list of [state.episodes, state.weights, state.injections])
    if (new Set(list.map((x) => x.id)).size !== list.length)
      throw new Error("Doppelte IDs innerhalb einer Eintragsart.");
  if (!state.profile) {
    if (
      state.episodes.length ||
      state.injections.length ||
      state.weights.length
    )
      throw new Error("Profil fehlt zu vorhandenen Einträgen.");
    return state;
  }
  if (
    Temporal.PlainDate.compare(
      state.profile.startDate,
      Temporal.Now.plainDateISO(state.profile.zone),
    ) > 0
  )
    throw new Error("Das Startdatum liegt in der Zukunft.");
  const active = state.episodes.find(
    (e) => e.id === state.profile?.activeEpisodeId,
  );
  if (!active || active.end)
    throw new Error(
      "Aktive Behandlungsepisode fehlt oder ist bereits beendet.",
    );
  for (const e of state.episodes) {
    validateTreatment(e);
    if (e.end && Date.parse(e.end) < Date.parse(e.start))
      throw new Error("Eine Episode endet vor ihrem Beginn.");
    if (Date.parse(e.start) > now)
      throw new Error("Eine Behandlungsepisode beginnt in der Zukunft.");
  }
  for (const i of state.injections) {
    const e = state.episodes.find((e) => e.id === i.episodeId);
    if (!e || e.substanceId !== i.substanceId)
      throw new Error("Wirkstoffzuordnung einer Injektion ist ungültig.");
    validateTreatment(i);
    if (
      e.customSubstanceName !== i.customSubstanceName ||
      e.customHalfLifeHours !== i.customHalfLifeHours
    )
      throw new Error(
        "Eigene Wirkstoffdaten einer Injektion passen nicht zur Episode.",
      );
    if (Date.parse(i.at) > now)
      throw new Error("Eine dokumentierte Injektion liegt in der Zukunft.");
    if (
      Date.parse(i.at) < Date.parse(e.start) ||
      (e.end && Date.parse(i.at) >= Date.parse(e.end))
    )
      throw new Error(
        "Eine Injektion liegt außerhalb ihrer Behandlungsepisode.",
      );
  }
  if (state.weights.some((w) => Date.parse(w.at) > now))
    throw new Error("Ein Gewichtseintrag liegt in der Zukunft.");
  return state;
}
export function parseImport(text: string): AppState {
  if (new TextEncoder().encode(text).length > 15 * 1024 * 1024)
    throw new Error("Datei ist zu groß (max. 15 MB).");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Die Datei enthält kein gültiges JSON.");
  }
  if (value && typeof value === "object" && "data" in value) {
    const envelope = value as { format?: string; data: unknown };
    if (!["InjektionsTagebuch", "Injekto-log"].includes(envelope.format ?? ""))
      throw new Error("Unbekanntes Exportformat.");
    value = envelope.data;
  }
  return validateState(value);
}
export const jsonExport = (state: AppState) =>
  JSON.stringify(
    {
      format: "Injekto-log",
      exportedAt: new Date().toISOString(),
      data: state,
    },
    null,
    2,
  );
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export function countConflicts(a: AppState, b: AppState) {
  let count = 0;
  for (const key of ["episodes", "injections", "weights"] as const)
    for (const entry of b[key]) {
      const old = a[key].find((e) => e.id === entry.id);
      if (old && !same(old, entry)) count++;
    }
  return count;
}
function mergeList<T extends { id: string }>(
  a: T[],
  b: T[],
  choice: "keep" | "incoming",
) {
  const map = new Map(a.map((e) => [e.id, e]));
  for (const e of b)
    if (!map.has(e.id) || choice === "incoming") map.set(e.id, e);
  return [...map.values()];
}
export function mergeStates(
  a: AppState,
  b: AppState,
  choice?: "keep" | "incoming",
): AppState {
  if (countConflicts(a, b) && !choice)
    throw new Error(
      "IDs mit unterschiedlichen Inhalten: bitte Konfliktbehandlung auswählen.",
    );
  if (!a.profile) return b;
  return validateState({
    ...a,
    episodes: mergeList<Episode>(a.episodes, b.episodes, choice ?? "keep"),
    injections: mergeList<Injection>(
      a.injections,
      b.injections,
      choice ?? "keep",
    ),
    weights: mergeList<Weight>(a.weights, b.weights, choice ?? "keep"),
  });
}
function cell(value: string | number) {
  let s = String(value);
  if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/.test(s))
    s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function csvExport(state: AppState, kind: "weights" | "injections") {
  const rows: (string | number)[][] =
    kind === "weights"
      ? [
          ["ID", "Zeitpunkt (ISO mit Zeitzone)", "Gewicht (kg)"],
          ...state.weights.map((w) => [w.id, w.at, fmtNum(w.kg, 4)]),
        ]
      : [
          [
            "ID",
            "Episode",
            "Wirkstoff",
            "Präparat",
            "Zeitpunkt (ISO mit Zeitzone)",
            "Dosis (mg)",
            "Stelle",
            "Notiz",
            "Nebenwirkungen",
          ],
          ...state.injections.map((i) => [
            i.id,
            i.episodeId,
            treatmentSubstance(i).name,
            treatmentProduct(i).name,
            i.at,
            fmtNum(i.mg, 6),
            i.site,
            i.note,
            i.effects,
          ]),
        ];
  return (
    "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n"
  );
}
