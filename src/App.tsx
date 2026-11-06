import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  History as HistoryIcon,
  Info,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Plus,
  Scale,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import type { AppState, Injection, Weight } from "./types";
import { useDiary } from "./store/useDiary";
import { appInfo, DISCLAIMER } from "./config/appInfo";
import { Onboarding } from "./features/Onboarding";
import { Dashboard } from "./features/Dashboard";
import { History } from "./features/History";
import { Settings } from "./features/Settings";
import { About, Donation } from "./features/About";
import { EntryForm } from "./features/EntryForm";
import { ImportDialog } from "./features/ImportDialog";
import { PwaStatus } from "./components/PwaStatus";
import { Logo } from "./components/Logo";
import { useFileBackup } from "./store/useFileBackup";
import { downloadFile } from "./utils/calendar";
import { fmtDate } from "./utils/time";
type Page = "dashboard" | "history" | "settings" | "about";
const pages = [
  { id: "dashboard" as const, label: "Übersicht", icon: LayoutDashboard },
  { id: "history" as const, label: "Verlauf", icon: HistoryIcon },
  { id: "settings" as const, label: "Einstellungen", icon: Settings2 },
  { id: "about" as const, label: "Über diese App", icon: Info },
];
const titles: Record<
  Page,
  { eyebrow: string; title: string; description: string }
> = {
  dashboard: {
    eyebrow: "DEIN PERSÖNLICHES PROTOKOLL",
    title: "Dein Verlauf, im Blick.",
    description:
      "Ein ruhiger Überblick über deine Injektionen und dein Gewicht.",
  },
  history: {
    eyebrow: "SCHRITT FÜR SCHRITT",
    title: "Dein Tagebuch.",
    description: "Deine Einträge, übersichtlich und jederzeit nachvollziehbar.",
  },
  settings: {
    eyebrow: "SO, WIE ES FÜR DICH PASST",
    title: "Deine Einstellungen.",
    description: "Profil, eingetragener Zeitplan und deine Datensicherung.",
  },
  about: {
    eyebrow: "GUT ZU WISSEN",
    title: "Einfach. Transparent. Persönlich.",
    description: "Wie dein Tagebuch funktioniert und wo seine Grenzen liegen.",
  },
};
function initialPage(): Page {
  const h = location.hash.slice(1);
  return pages.some((p) => p.id === h) ? (h as Page) : "dashboard";
}
export default function App() {
  const diary = useDiary();
  const { state } = diary;
  const backup = useFileBackup(state, !!diary.error || diary.external);
  const [page, setPage] = useState<Page>(initialPage);
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState("");
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<{
    kind: "injection" | "weight";
    id: string;
  } | null>(null);
  const [form, setForm] = useState<{
    kind: "injection" | "weight";
    entry?: Injection | Weight;
  } | null>(null);
  const [incoming, setIncoming] = useState<AppState | null>(null);
  const profile = state.profile;
  const episode =
    state.episodes.find(
      (e) => e.id === (selected || profile?.activeEpisodeId),
    ) ?? state.episodes.find((e) => e.id === profile?.activeEpisodeId);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const hash = () => setPage(initialPage());
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (document.querySelector("dialog[open] form")) e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);
  const go = (p: Page) => {
    setPage(p);
    setMenu(false);
    location.hash = p;
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const save = (s: AppState) => {
    diary.save(s);
    setNow(Date.now());
  };
  const saveEntry = (s: AppState) => {
    save(s);
    setForm(null);
    setToast("Eintrag gespeichert.");
  };
  function remove(kind: "injection" | "weight", id: string) {
    setDeleting({ kind, id });
  }
  const title = titles[page];
  const formEpisode =
    form?.entry && "episodeId" in form.entry
      ? state.episodes.find((e) => e.id === (form.entry as Injection).episodeId)
      : state.episodes.find((e) => e.id === profile?.activeEpisodeId);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      <aside className={"sidebar " + (menu ? "is-open" : "")}>
        <a
          className="brand"
          href="#dashboard"
          onClick={() => go("dashboard")}
          aria-label="Injekto-log – Übersicht"
        >
          <span className="brand-icon">
            <Logo size={32} />
          </span>
          <span>
            <span className="brand-name">
              Injekto<span>-log</span>
            </span>
            <small>DEIN VERLAUF. DEIN TEMPO.</small>
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          onClick={() => setMenu(false)}
          aria-label="Menü schließen"
        >
          <X />
        </button>
        <div className="sidebar-divider" />
        <p className="nav-caption">DEIN TAGEBUCH</p>
        <nav aria-label="Hauptnavigation">
          {pages.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={"#" + id}
              className={"nav-item " + (page === id ? "active" : "")}
              aria-current={page === id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(id);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {page === id && <ChevronRight size={15} />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="local-icon">
              <LockKeyhole size={17} />
            </span>
            <div>
              <strong>Nur auf deinem Gerät</strong>
              <p>
                Deine Protokolle bleiben
                <br />
                in diesem Browser.
              </p>
            </div>
          </div>
          <Donation />
          <div className="sidebar-version">
            <span>Mit Sorgfalt entwickelt.</span>
            <span>v{appInfo.version}</span>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-backdrop"
          aria-label="Menü schließen"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
              aria-expanded={menu}
              aria-label="Menü öffnen"
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Mein Tagebuch <ChevronRight size={13} />{" "}
              <strong>{pages.find((x) => x.id === page)?.label}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <span className="live-dot" />
              {diary.error
                ? "Speicher prüfen"
                : profile
                  ? "Lokal gespeichert"
                  : "Lokale Speicherung"}
            </span>
            <span className="today-date">
              <CalendarDays size={15} />
              {fmtDate(now, profile?.zone, false)}
            </span>
          </div>
        </header>
        <main id="main">
          <PwaStatus />
          {backup.linked && backup.problem && (
            <div className="status-banner" role="alert">
              <span>Zusätzliche Dateisicherung pausiert: {backup.message}</span>
              <button className="text-button" onClick={() => go("settings")}>
                Sicherung prüfen
              </button>
            </div>
          )}
          {diary.external && (
            <div className="status-banner" role="alert">
              Daten wurden in einem anderen Tab geändert. Speichere hier nicht
              weiter.
              <button
                className="button secondary"
                onClick={() => {
                  if (
                    !document.querySelector("dialog[open]") ||
                    confirm(
                      "Ungespeicherte Eingaben verwerfen und aktuellen Stand laden?",
                    )
                  )
                    diary.reload();
                }}
              >
                Aktuellen Stand laden
              </button>
            </div>
          )}
          <div className="page-header">
            <div>
              <p className="eyebrow">{title.eyebrow}</p>
              <h1>{title.title}</h1>
              <p className="page-subtitle">{title.description}</p>
            </div>
            {profile && page !== "about" && (
              <div className="header-actions">
                <button
                  className="button secondary"
                  onClick={() => setForm({ kind: "weight" })}
                >
                  <Scale size={18} />
                  <span>Gewicht eintragen</span>
                </button>
                <button
                  className="button primary"
                  onClick={() => setForm({ kind: "injection" })}
                >
                  <Plus size={18} />
                  <span>Injektion dokumentieren</span>
                </button>
              </div>
            )}
          </div>
          <section className="disclaimer" aria-label="Wichtiger Hinweis">
            <ShieldCheck size={21} />
            <p>{DISCLAIMER}</p>
          </section>
          {diary.error && (
            <div className="status-banner" role="alert">
              <div>
                <strong>Bitte Daten prüfen</strong>
                <p>{diary.error}</p>
              </div>
              {diary.raw && (
                <button
                  className="button secondary"
                  onClick={() =>
                    downloadFile(
                      "Tagebuch-Rohdaten-Sicherung.json",
                      diary.raw,
                      "application/json",
                    )
                  }
                >
                  Rohdaten sichern
                </button>
              )}
              <button
                className="button secondary"
                onClick={async () => {
                  if (
                    confirm(
                      "Eigene Browserdaten unwiderruflich entfernen? Vorher bitte Rohdaten sichern.",
                    )
                  ) {
                    await backup.disconnect();
                    diary.reset();
                  }
                }}
              >
                Zurücksetzen
              </button>
            </div>
          )}
          {page === "about" ? (
            <About />
          ) : !profile ? (
            <Onboarding
              state={state}
              onSave={(s) => {
                save(s);
                setSelected("");
                setToast("Dein Tagebuch ist bereit.");
              }}
            />
          ) : episode && page === "dashboard" ? (
            <Dashboard
              state={state}
              episode={episode}
              setEpisode={setSelected}
              onAdd={(kind) => setForm({ kind })}
              onHistory={() => go("history")}
              onSave={(s) => {
                try {
                  save(s);
                } catch (e) {
                  setToast(
                    e instanceof Error
                      ? e.message
                      : "Speichern fehlgeschlagen.",
                  );
                }
              }}
              now={now}
            />
          ) : page === "history" ? (
            <History
              state={state}
              onEdit={(kind, entry) => setForm({ kind, entry })}
              onDelete={remove}
              onAdd={(kind) => setForm({ kind })}
            />
          ) : (
            <Settings
              backup={backup}
              key={state.profile?.activeEpisodeId}
              state={state}
              onSave={(s) => {
                save(s);
                setSelected("");
              }}
              onReset={async () => {
                await backup.disconnect();
                diary.reset();
                setSelected("");
                go("dashboard");
              }}
              onImport={setIncoming}
              onNotify={setToast}
            />
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} /> Persönlich dokumentieren. Bewusst im
              Blick behalten.
            </span>
            <button className="text-button" onClick={() => go("about")}>
              Über diese App <ArrowRight size={14} />
            </button>
            <Donation />
            <span className="footer-owner">Konzept: {appInfo.owner}</span>
          </footer>
        </main>
      </div>
      {form && profile && formEpisode && (
        <EntryForm
          kind={form.kind}
          entry={form.entry}
          episode={formEpisode}
          state={state}
          onClose={() => setForm(null)}
          onSave={saveEntry}
        />
      )}{" "}
      {incoming && (
        <ImportDialog
          current={state}
          incoming={incoming}
          onClose={() => setIncoming(null)}
          onImport={(s) => {
            save(s);
            setIncoming(null);
            setSelected("");
            setToast("Backup erfolgreich importiert.");
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            try {
              save(
                deleting.kind === "injection"
                  ? {
                      ...state,
                      injections: state.injections.filter(
                        (i) => i.id !== deleting.id,
                      ),
                    }
                  : {
                      ...state,
                      weights: state.weights.filter(
                        (w) => w.id !== deleting.id,
                      ),
                    },
              );
              setDeleting(null);
              setToast("Eintrag gelöscht.");
            } catch (e) {
              setToast(
                e instanceof Error ? e.message : "Löschen fehlgeschlagen.",
              );
            }
          }}
        />
      )}{" "}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Meldung schließen"
          >
            <X size={17} />
          </button>
        </div>
      )}
      <div className="mobile-tabbar">
        <nav aria-label="Mobile Navigation">
          {pages.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => go(id)}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{id === "about" ? "Info" : label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
import { Dialog } from "./components/Dialog";
function ConfirmDelete({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      title="Eintrag wirklich löschen?"
      subtitle="Diese Änderung ist nicht rückgängig zu machen."
      onClose={onClose}
    >
      <p>
        Der Eintrag wird aus deinem Protokoll entfernt. Dashboard und
        Modellrechnung werden anschließend aktualisiert.
      </p>
      <div className="form-actions">
        <button className="button secondary" onClick={onClose}>
          Abbrechen
        </button>
        <button className="button primary" onClick={onConfirm}>
          Löschen bestätigen
        </button>
      </div>
    </Dialog>
  );
}
