import type { Injection } from "../types";
import { HOUR } from "./time";
export function doseContribution(
  mg: number,
  at: number,
  t: number,
  halfLife: number,
) {
  if (!Number.isFinite(halfLife) || halfLife <= 0)
    throw new Error("Ungültige Halbwertszeit.");
  return t < at ? 0 : mg * Math.pow(0.5, (t - at) / HOUR / halfLife);
}
export function remaining(
  injections: Pick<Injection, "at" | "mg">[],
  t: number,
  halfLife: number,
) {
  return injections.reduce(
    (sum, i) => sum + doseContribution(i.mg, Date.parse(i.at), t, halfLife),
    0,
  );
}
export function relative(
  injections: Pick<Injection, "at" | "mg">[],
  t: number,
  halfLife: number,
) {
  const past = injections.filter((i) => Date.parse(i.at) <= t);
  if (!past.length) return null;
  const last = Math.max(...past.map((i) => Date.parse(i.at)));
  const ref = remaining(past, last, halfLife);
  return ref > 0 ? (100 * remaining(past, t, halfLife)) / ref : null;
}
