import { describe, it, expect } from "vitest";
import { doseContribution, remaining, relative } from "../src/utils/model";
import {
  calendarOccurrences,
  nextScheduled,
  projectFuture,
} from "../src/utils/schedule";
import {
  localToISO,
  localInput,
  numberInput,
  HOUR,
  daysSince,
} from "../src/utils/time";
import {
  parseImport,
  validateState,
  jsonExport,
  csvExport,
  countConflicts,
  mergeStates,
} from "../src/utils/importExport";
import { calendarICS } from "../src/utils/calendar";
import { blankState } from "../src/types";
import type { AppState, Injection, Schedule } from "../src/types";
import { SUBSTANCES } from "../src/data/substances";
const at = Date.parse("2026-01-01T12:00:00Z");
function fixture(): AppState {
  const s = blankState(),
    t = "2026-01-01T12:00:00Z";
  return {
    ...s,
    profile: {
      startDate: "2026-01-01",
      startWeight: 100,
      preferredTime: "18:00",
      zone: "Europe/Berlin",
      activeEpisodeId: "episode1",
      studyEnabled: false,
    },
    episodes: [
      {
        id: "episode1",
        substanceId: "tirzepatide",
        productId: "mounjaro",
        start: "2026-01-01T00:00:00Z",
        schedule: { mode: "interval", hours: 168 },
        createdAt: t,
        updatedAt: t,
      },
    ],
    injections: [
      {
        id: "inj1",
        episodeId: "episode1",
        substanceId: "tirzepatide",
        productId: "mounjaro",
        at: t,
        mg: 5,
        site: "Bauch links",
        note: "",
        effects: "",
        createdAt: t,
        updatedAt: t,
      },
    ],
    weights: [{ id: "w1", at: t, kg: 100, createdAt: t, updatedAt: t }],
  };
}
describe("Eliminationsmodell", () => {
  it("rechnet 50 Prozent nach einer und 3,125 Prozent nach fünf Halbwertszeiten", () => {
    expect(doseContribution(5, at, at + 120 * HOUR, 120)).toBeCloseTo(2.5);
    expect(doseContribution(5, at, at + 600 * HOUR, 120)).toBeCloseTo(0.15625);
  });
  it("addiert auch alte Beiträge und ignoriert zukünftige Gaben", () => {
    const list = [
      { at: new Date(at).toISOString(), mg: 5 },
      { at: new Date(at + 120 * HOUR).toISOString(), mg: 5 },
    ];
    expect(remaining(list, at + 120 * HOUR, 120)).toBeCloseTo(7.5);
    expect(remaining(list, at, 120)).toBe(5);
    expect(remaining(list, at + 1200 * HOUR, 120)).toBeGreaterThan(0);
  });
  it("verwendet den gesamten Referenzwert inklusive Akkumulation", () => {
    const list = [
      { at: new Date(at).toISOString(), mg: 5 },
      { at: new Date(at + 120 * HOUR).toISOString(), mg: 5 },
    ];
    expect(relative(list, at + 120 * HOUR, 120)).toBeCloseTo(100);
    expect(relative(list, at + 240 * HOUR, 120)).toBeCloseTo(50);
  });
  it("behandelt gleichzeitige Dosen und fehlende Daten", () => {
    expect(relative([], at, 120)).toBeNull();
    expect(
      relative([{ at: new Date(at + HOUR).toISOString(), mg: 5 }], at, 120),
    ).toBeNull();
    expect(
      relative(
        [
          { at: new Date(at).toISOString(), mg: 5 },
          { at: new Date(at).toISOString(), mg: 2.5 },
        ],
        at,
        120,
      ),
    ).toBe(100);
  });
  it("Liraglutid verwendet eine stundenfeine Halbwertszeit", () => {
    expect(doseContribution(3, at, at + 13 * HOUR, 13)).toBe(1.5);
  });
  it("hat die getrennten Wirkstoffkonstanten", () => {
    expect(SUBSTANCES.find((s) => s.id === "semaglutide")?.halfLife).toBe(168);
    expect(SUBSTANCES.find((s) => s.id === "retatrutide")?.halfLife).toBe(144);
  });
});
const weekly: Extract<Schedule, { mode: "calendar" }> = {
  mode: "calendar",
  cadence: "weekly",
  weekday: 7,
  time: "18:00",
  zone: "Europe/Berlin",
  anchor: "2026-03-22T00:00:00Z",
  skipped: [],
};
describe("Zeitplan und Zeitumstellung", () => {
  it("hält lokale Kalenderzeit über die Sommerzeitumstellung", () => {
    const points = calendarOccurrences(
      weekly,
      Date.parse("2026-04-01T00:00:00Z"),
    );
    expect(points.map((x) => localInput(x, "Europe/Berlin"))).toEqual([
      "2026-03-22T18:00",
      "2026-03-29T18:00",
    ]);
    expect((points[1] - points[0]) / HOUR).toBe(167);
  });
  it("hält 168 verstrichene Stunden im Abstandsmodus", () => {
    const t = "2026-03-22T17:00:00Z";
    expect(
      localInput(
        nextScheduled(
          { mode: "interval", hours: 168 },
          [{ at: t }],
          Date.parse(t),
        )!,
        "Europe/Berlin",
      ),
    ).toBe("2026-03-29T19:00");
  });
  it("hält Kalenderzeit bei Winterzeit und 169 Stunden Abstand", () => {
    const points = calendarOccurrences(
      { ...weekly, anchor: "2026-10-18T00:00:00Z" },
      Date.parse("2026-10-26T00:00:00Z"),
    );
    expect(points.map((x) => localInput(x, "Europe/Berlin"))).toEqual([
      "2026-10-18T18:00",
      "2026-10-25T18:00",
    ]);
    expect((points[1] - points[0]) / HOUR).toBe(169);
  });
  it("hält verstrichene Termine sichtbar statt automatisch weiterzuspringen", () => {
    expect(nextScheduled(weekly, [], Date.parse("2026-04-01T00:00:00Z"))).toBe(
      Date.parse("2026-03-22T17:00:00Z"),
    );
  });
  it("verarbeitet bewusst übersprungene Termine ohne Gabe", () => {
    const s = { ...weekly, skipped: ["2026-03-22T17:00:00.000Z"] };
    expect(nextScheduled(s, [], Date.parse("2026-04-01T00:00:00Z"))).toBe(
      Date.parse("2026-03-29T16:00:00Z"),
    );
  });
  it("schließt durch tatsächlichen Eintrag den jeweiligen lokalen Kalendertag ab", () => {
    expect(
      nextScheduled(
        weekly,
        [{ at: "2026-03-22T17:30:00Z" }],
        Date.parse("2026-03-23T00:00:00Z"),
      ),
    ).toBe(Date.parse("2026-03-29T16:00:00Z"));
  });
  it("erfindet ohne Injektion oder bei ausschließlich zukünftigen Gaben keinen Abstandstermin", () => {
    expect(nextScheduled({ mode: "interval", hours: 168 }, [])).toBeNull();
    expect(
      nextScheduled({ mode: "interval", hours: 168 }, [
        { at: "2099-01-01T00:00:00Z" },
      ]),
    ).toBeNull();
  });
  it("weist mehrdeutige und nicht existente manuelle Uhrzeiten zurück", () => {
    expect(() => localToISO("2026-03-29T02:30", "Europe/Berlin")).toThrow();
    expect(() => localToISO("2026-10-25T02:30", "Europe/Berlin")).toThrow();
  });
  it("behandelt nicht existente wiederkehrende Uhrzeiten nachvollziehbar", () => {
    const points = calendarOccurrences(
      { ...weekly, time: "02:30", anchor: "2026-03-29T00:00:00Z" },
      Date.parse("2026-03-30T00:00:00Z"),
    );
    expect(localInput(points[0], "Europe/Berlin")).toBe("2026-03-29T03:30");
  });
  it("zählt Kalendertage unabhängig von der Länge eines Tages", () => {
    expect(
      daysSince(
        "2026-03-28",
        "Europe/Berlin",
        Date.parse("2026-03-30T00:00:00Z"),
      ),
    ).toBe(2);
  });
  it("schreibt Vorschauen nicht in die ursprünglichen Daten", () => {
    const injections = fixture().injections;
    const copy = JSON.stringify(injections);
    const future = projectFuture(
      { mode: "interval", hours: 168 },
      injections,
      at + HOUR,
      at + 14 * 24 * HOUR,
    );
    expect(future.length).toBe(2);
    expect(JSON.stringify(injections)).toBe(copy);
    expect(
      projectFuture(
        { mode: "interval", hours: 168 },
        injections,
        at + 200 * HOUR,
        at + 400 * HOUR,
      ),
    ).toEqual([]);
  });
});
describe("Validierung und Datensicherung", () => {
  it("akzeptiert Dezimalkomma und Punkt, verhindert NaN und negative Werte", () => {
    expect(numberInput("2,5")).toBe(2.5);
    expect(numberInput("2.5")).toBe(2.5);
    for (const n of ["-1", "0", "Infinity", "1,2.3", "1e9"])
      expect(() => numberInput(n)).toThrow();
  });
  it("erhält sämtliche Daten im JSON-Roundtrip", () => {
    const s = fixture();
    expect(parseImport(jsonExport(s))).toEqual(s);
  });
  it("verwirft fremde Versionen, falsche Strukturen und beschädigtes JSON", () => {
    expect(() => parseImport("{")).toThrow();
    expect(() => validateState({ ...fixture(), schemaVersion: 2 })).toThrow();
    expect(() => validateState({ ...fixture(), unexpected: true })).toThrow();
  });
  it("verhindert doppelte IDs, falsche Episoden und zukünftige tatsächliche Einträge", () => {
    const s = fixture();
    expect(() =>
      validateState({ ...s, injections: [...s.injections, ...s.injections] }),
    ).toThrow();
    expect(() =>
      validateState({
        ...s,
        injections: [{ ...s.injections[0], substanceId: "semaglutide" }],
      }),
    ).toThrow();
    expect(() =>
      validateState({
        ...s,
        weights: [{ ...s.weights[0], at: "2099-01-01T00:00:00Z" }],
      }),
    ).toThrow();
  });
  it("weist Einträge außerhalb der Episode und unbekannte Präparate zurück", () => {
    const s = fixture();
    expect(() =>
      validateState({
        ...s,
        injections: [{ ...s.injections[0], at: "2025-12-31T12:00:00Z" }],
      }),
    ).toThrow();
    expect(() =>
      validateState({
        ...s,
        episodes: [{ ...s.episodes[0], productId: "unbekannt" }],
      }),
    ).toThrow();
  });
  it("führt identische IDs nicht doppelt zusammen", () => {
    const s = fixture();
    expect(mergeStates(s, s).injections.length).toBe(1);
  });
  it("verlangt eine ausdrückliche Entscheidung bei Konflikten und verändert Quelle nicht", () => {
    const s = fixture(),
      other = fixture();
    other.weights[0].kg = 95;
    const before = JSON.stringify(s);
    expect(countConflicts(s, other)).toBe(1);
    expect(() => mergeStates(s, other)).toThrow();
    expect(mergeStates(s, other, "keep").weights[0].kg).toBe(100);
    expect(mergeStates(s, other, "incoming").weights[0].kg).toBe(95);
    expect(JSON.stringify(s)).toBe(before);
  });
  it("exportiert deutsches CSV mit BOM, Escaping und Formelabsicherung", () => {
    const s = fixture();
    s.injections[0].note = '=HYPERLINK("test")';
    s.injections[0].effects = "Zeile 1\nZeile 2";
    const csv = csvExport(s, "injections");
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('\'=HYPERLINK(""test"")');
    expect(csv).toContain('"Zeile 1\nZeile 2"');
    expect(csv).toContain("2026-01-01T12:00:00Z");
  });
  it("erstellt einen einzelnen UTC-Kalendertermin ohne Alarm oder Wiederholung", () => {
    const ics = calendarICS(at, "Änderung, Notiz; Test\nZeile");
    expect(ics).toContain("DTSTART:20260101T120000Z\r\n");
    expect(ics).toContain("SUMMARY:Persönlicher Protokolltermin");
    expect(ics).not.toContain("RRULE");
    expect(ics).not.toContain("VALARM");
    expect(ics).toContain("\\,");
    expect(ics).toContain("\\;");
    expect(ics).toContain("\\n");
    for (const line of ics.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
