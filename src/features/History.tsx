import { useState } from "react";
import { Pencil, Trash2, Syringe, Scale, Search, Plus } from "lucide-react";
import type { AppState, Injection, Weight } from "../types";
import { treatmentProduct } from "../utils/treatment";
import { fmtDate, fmtNum } from "../utils/time";
export function History({
  state,
  onEdit,
  onDelete,
  onAdd,
}: {
  state: AppState;
  onEdit: (k: "injection" | "weight", e: Injection | Weight) => void;
  onDelete: (k: "injection" | "weight", id: string) => void;
  onAdd: (k: "injection" | "weight") => void;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(30);
  const entries = [
    ...state.injections.map((e) => ({ kind: "injection" as const, entry: e })),
    ...state.weights.map((e) => ({ kind: "weight" as const, entry: e })),
  ]
    .sort((a, b) => Date.parse(b.entry.at) - Date.parse(a.entry.at))
    .filter(
      (x) =>
        (filter === "all" || filter === x.kind) &&
        JSON.stringify(x.entry)
          .toLocaleLowerCase("de")
          .includes(search.toLocaleLowerCase("de")),
    );
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">DEIN PROTOKOLL</p>
          <h2>Alles an einem Ort.</h2>
        </div>
        <span className="count-badge">
          {state.injections.length + state.weights.length} Einträge
        </span>
      </div>
      <div className="history-toolbar">
        <div className="segmented" aria-label="Eintragsart">
          {[
            ["all", "Alle"],
            ["injection", "Injektionen"],
            ["weight", "Gewicht"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={filter === v ? "active" : ""}
              onClick={() => {
                setFilter(v);
                setLimit(30);
              }}
              aria-pressed={filter === v}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Verlauf durchsuchen"
            placeholder="Verlauf durchsuchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Syringe size={25} />
          </div>
          <h3>
            {search
              ? "Keine passenden Einträge"
              : "Dein Verlauf wartet auf den ersten Eintrag."}
          </h3>
          <p>Dokumentiere eine erfolgte Injektion oder einen Wiegemoment.</p>
          <button
            className="button secondary"
            onClick={() => onAdd("injection")}
          >
            <Plus size={17} />
            Injektion dokumentieren
          </button>
        </div>
      ) : (
        <div className="entry-list">
          {entries.slice(0, limit).map(({ kind, entry }) => (
            <article className="history-entry" key={kind + entry.id}>
              <div className={"entry-icon " + kind}>
                {kind === "injection" ? (
                  <Syringe size={19} />
                ) : (
                  <Scale size={19} />
                )}
              </div>
              <div className="entry-content">
                <div className="entry-top">
                  <strong>
                    {"mg" in entry
                      ? fmtNum(entry.mg, 4) +
                        " mg · " +
                        treatmentProduct(entry).name
                      : fmtNum(entry.kg, 2) + " kg"}
                  </strong>
                  <span>{fmtDate(entry.at, state.profile!.zone)}</span>
                </div>
                <p>
                  {"mg" in entry
                    ? entry.site || "Injektionsstelle nicht angegeben"
                    : "Gewichtseintrag"}
                  {"mg" in entry &&
                  entry.episodeId !== state.profile!.activeEpisodeId
                    ? " · frühere Behandlung"
                    : ""}
                </p>
                {"mg" in entry && entry.note && (
                  <p className="entry-note">{entry.note}</p>
                )}
                {"mg" in entry && entry.effects && (
                  <p className="entry-note">Nebenwirkungen: {entry.effects}</p>
                )}
              </div>
              <div className="entry-actions">
                <button
                  className="icon-button"
                  aria-label={
                    "Eintrag vom " +
                    fmtDate(entry.at, state.profile!.zone) +
                    " bearbeiten"
                  }
                  onClick={() => onEdit(kind, entry)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={
                    "Eintrag vom " +
                    fmtDate(entry.at, state.profile!.zone) +
                    " löschen"
                  }
                  onClick={() => onDelete(kind, entry.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {entries.length > limit && (
        <button
          className="button secondary"
          onClick={() => setLimit(limit + 30)}
        >
          Weitere Einträge anzeigen
        </button>
      )}
    </section>
  );
}
