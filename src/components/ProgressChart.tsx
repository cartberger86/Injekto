import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppState, Episode } from "../types";
import { treatmentSubstance } from "../utils/treatment";
import { remaining } from "../utils/model";
import { projectFuture } from "../utils/schedule";
import { fmtDate, fmtNum, HOUR } from "../utils/time";
interface Point {
  t: number;
  model?: number;
  future?: number;
  weight?: number;
  dose?: number;
  marker?: number;
}
export function ProgressChart({
  state,
  episode,
  weeks,
  preview,
  now,
}: {
  state: AppState;
  episode: Episode;
  weeks: number;
  preview: boolean;
  now: number;
}) {
  const half = treatmentSubstance(episode).halfLife;
  const injections = state.injections.filter((i) => i.episodeId === episode.id);
  const points = useMemo(() => {
    const min = now - weeks * 7 * 24 * HOUR,
      max = preview ? now + 14 * 24 * HOUR : now;
    const virtual =
      preview && half !== null
        ? projectFuture(episode.schedule, injections, now, max)
        : [];
    const times = new Set<number>([min, now, max]);
    const step = half !== null && half <= 24 ? HOUR : 3 * HOUR;
    for (let t = min; t < max; t += step) times.add(t);
    for (const i of [...injections, ...virtual]) {
      const t = Date.parse(i.at);
      if (t >= min && t <= max) {
        times.add(Math.max(t - 1, min));
        times.add(t);
      }
    }
    for (const w of state.weights) {
      const t = Date.parse(w.at);
      if (t >= min && t <= max) times.add(t);
    }
    const weights = new Map(state.weights.map((w) => [Date.parse(w.at), w.kg]));
    return [...times]
      .sort((a, b) => a - b)
      .map((t) => {
        const result: Point = { t };
        const after =
          t >= Date.parse(episode.start) &&
          (!episode.end || t < Date.parse(episode.end));
        if (
          half !== null &&
          after &&
          injections.some((i) => Date.parse(i.at) <= t)
        ) {
          if (t <= now) result.model = remaining(injections, t, half);
          if (preview && t >= now && virtual.length)
            result.future = remaining([...injections, ...virtual], t, half);
        }
        if (weights.has(t)) result.weight = weights.get(t);
        const dose = injections.find((i) => Date.parse(i.at) === t);
        if (dose) {
          result.dose = dose.mg;
          result.marker = result.model;
        }
        return result;
      });
  }, [state.weights, state.injections, episode, weeks, preview, now, half]);
  return (
    <div
      className="chart-container"
      role="img"
      aria-label={`Verlauf über ${weeks} Wochen: Gewicht in Kilogramm${half === null ? " (ohne Modellrechnung)" : " und modellierte Restmenge in Milligramm"}. Tabellenalternative unter dem Diagramm.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 15, right: 5, bottom: 4, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            stroke="#2a3339"
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
            tickCount={5}
            tickFormatter={(t) =>
              new Intl.DateTimeFormat("de-DE", {
                day: "2-digit",
                month: "2-digit",
                timeZone: state.profile!.zone,
              }).format(t)
            }
            stroke="#86949c"
            tickLine={false}
            axisLine={false}
            minTickGap={25}
          />
          <YAxis
            yAxisId="weight"
            domain={[
              (min: number) =>
                Math.floor(Math.min(min, state.profile!.startWeight) - 2),
              (max: number) =>
                Math.ceil(Math.max(max, state.profile!.startWeight) + 2),
            ]}
            width={48}
            tickFormatter={(v) => fmtNum(v)}
            stroke="#b6c6bf"
            tickLine={false}
            axisLine={false}
            label={{
              value: "kg",
              position: "insideTopLeft",
              offset: 0,
              fill: "#b6c6bf",
            }}
          />
          <YAxis
            yAxisId="model"
            hide={half === null}
            orientation="right"
            domain={[0, (max: number) => Math.max(1, max * 1.15)]}
            width={42}
            tickFormatter={(v) => fmtNum(v, 1)}
            stroke="#d6ba8a"
            tickLine={false}
            axisLine={false}
            label={{
              value: "mg*",
              position: "insideTopRight",
              offset: 0,
              fill: "#d6ba8a",
            }}
          />
          <ReferenceLine
            yAxisId="weight"
            y={state.profile!.startWeight}
            stroke="#69827a"
            strokeDasharray="3 5"
          />
          <ReferenceLine
            yAxisId="model"
            x={now}
            stroke="#53616b"
            strokeDasharray="3 4"
          />
          <Tooltip
            cursor={{ stroke: "#65747c", strokeDasharray: "4 4" }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as Point | undefined;
              return active && d ? (
                <div className="chart-tooltip">
                  <strong>{fmtDate(d.t, state.profile!.zone)}</strong>
                  {d.weight !== undefined && (
                    <p>Gewicht: {fmtNum(d.weight, 2)} kg</p>
                  )}
                  {d.model !== undefined && (
                    <p>Modell: {fmtNum(d.model, 3)} mg</p>
                  )}
                  {d.future !== undefined && (
                    <p>Annahme: {fmtNum(d.future, 3)} mg</p>
                  )}
                  {d.dose !== undefined && (
                    <p>Dokumentierte Injektion: {fmtNum(d.dose, 3)} mg</p>
                  )}
                </div>
              ) : null;
            }}
          />
          <Line
            yAxisId="weight"
            dataKey="weight"
            name="Gewicht"
            stroke="#9ad8bd"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#152920", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            yAxisId="model"
            dataKey="model"
            name="Modellierte mg"
            stroke="#d7b47b"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Scatter
            yAxisId="model"
            dataKey="marker"
            name="Dokumentierte Injektion"
            fill="#e7c893"
            isAnimationActive={false}
          />
          <Line
            yAxisId="model"
            dataKey="future"
            name="Annahme"
            stroke="#d7b47b"
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
