import { Temporal } from "@js-temporal/polyfill";
import type { Injection, Schedule } from "../types";
import { HOUR, localDate } from "./time";
export function calendarOccurrences(
  s: Extract<Schedule, { mode: "calendar" }>,
  until: number,
) {
  const start = Temporal.Instant.from(s.anchor)
    .toZonedDateTimeISO(s.zone)
    .toPlainDate();
  const end = Temporal.Instant.from(new Date(until).toISOString())
    .toZonedDateTimeISO(s.zone)
    .toPlainDate();
  const result: number[] = [];
  let date = start;
  for (
    let count = 0;
    Temporal.PlainDate.compare(date, end) <= 0 && count < 100000;
    count++, date = date.add({ days: 1 })
  ) {
    if (s.cadence === "weekly" && date.dayOfWeek !== s.weekday) continue;
    // Wiederkehrende Kalendertermine: nicht existente Uhrzeit vorwärts verschieben,
    // doppelte Uhrzeit beim ersten Auftreten verwenden (Temporal compatible).
    const at = date.toPlainDateTime(s.time).toZonedDateTime(s.zone, {
      disambiguation: "compatible",
    }).epochMilliseconds;
    if (
      at >= Date.parse(s.anchor) &&
      !s.skipped.includes(new Date(at).toISOString())
    )
      result.push(at);
  }
  return result;
}
export function nextScheduled(
  s: Schedule,
  injections: Pick<Injection, "at">[],
  now = Date.now(),
): number | null {
  if (s.mode === "none") return null;
  if (s.mode === "interval") {
    const past = injections.filter((i) => Date.parse(i.at) <= now);
    if (!past.length) return null;
    return Math.max(...past.map((i) => Date.parse(i.at))) + s.hours * HOUR;
  }
  const end = now + 370 * 24 * HOUR;
  const actualDates = new Set(
    injections
      .filter((i) => Date.parse(i.at) <= now)
      .map((i) => localDate(i.at, s.zone)),
  );
  return (
    calendarOccurrences(s, end).find(
      (at) => !actualDates.has(localDate(at, s.zone)),
    ) ?? null
  );
}
export function projectFuture(
  s: Schedule,
  injections: Injection[],
  now: number,
  until: number,
): { at: string; mg: number }[] {
  if (s.mode === "none") return [];
  const sorted = injections
    .filter((i) => Date.parse(i.at) <= now)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const last = sorted.at(-1);
  const next = nextScheduled(s, sorted, now);
  if (!last || next === null || next <= now) return [];
  const points: number[] = [];
  if (s.mode === "interval") {
    for (let t = next; t <= until && points.length < 1000; t += s.hours * HOUR)
      points.push(t);
  } else
    points.push(
      ...calendarOccurrences(s, until).filter((at) => at >= next && at > now),
    );
  return points.map((t) => ({ at: new Date(t).toISOString(), mg: last.mg }));
}
