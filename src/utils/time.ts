import { Temporal } from "@js-temporal/polyfill";
export const HOUR = 3600000;
export const isoNow = () => new Date().toISOString();
export const defaultZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
export const localDate = (
  at: string | number = Date.now(),
  zone = defaultZone(),
) =>
  Temporal.Instant.from(new Date(at).toISOString())
    .toZonedDateTimeISO(zone)
    .toPlainDate()
    .toString();
export const localInput = (
  at: string | number = Date.now(),
  zone = defaultZone(),
) =>
  Temporal.Instant.from(new Date(at).toISOString())
    .toZonedDateTimeISO(zone)
    .toPlainDateTime()
    .toString({ smallestUnit: "minute" });
export function localToISO(value: string, zone: string) {
  try {
    return Temporal.PlainDateTime.from(value)
      .toZonedDateTime(zone, { disambiguation: "reject" })
      .toInstant()
      .toString();
  } catch {
    throw new Error(
      "Diese Uhrzeit ist ungültig oder wegen der Zeitumstellung nicht eindeutig. Bitte wähle eine eindeutige Uhrzeit.",
    );
  }
}
export const fmtDate = (
  at: string | number,
  zone = defaultZone(),
  time = true,
) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: zone,
  }).format(new Date(at));
export const fmtNum = (n: number, max = 1) =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: max }).format(n);
export function numberInput(value: string) {
  if (!/^\s*\d+(?:[.,]\d+)?\s*$/.test(value))
    throw new Error("Bitte eine positive Zahl eingeben, z. B. 2,5.");
  const n = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0)
    throw new Error("Bitte eine positive Zahl eingeben.");
  return n;
}
export function validatePast(at: string, now = Date.now()) {
  if (!Number.isFinite(Date.parse(at)) || Date.parse(at) > now)
    throw new Error(
      "Bitte einen gültigen, bereits vergangenen Zeitpunkt wählen.",
    );
}
export const daysSince = (date: string, zone: string, now = Date.now()) =>
  Math.max(
    0,
    Temporal.PlainDate.from(date).until(
      Temporal.PlainDate.from(localDate(now, zone)),
    ).days,
  );
export function elapsed(ms: number) {
  const h = Math.max(0, Math.floor(ms / HOUR));
  return `${Math.floor(h / 24)} Tage ${h % 24} Stunden`;
}
