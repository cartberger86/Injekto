import { newId } from "../utils/id";
import { useEffect, useRef, useState } from "react";
import { blankState, STORAGE_KEY } from "../types";
import type { AppState } from "../types";
import { validateState } from "../utils/importExport";
function load() {
  let raw = "";
  try {
    raw = localStorage.getItem(STORAGE_KEY) ?? "";
    return {
      state: raw ? validateState(JSON.parse(raw)) : blankState(),
      error: "",
      raw: raw ?? "",
    };
  } catch (e) {
    return {
      state: blankState(),
      error:
        "Gespeicherte Daten konnten nicht geladen werden. " +
        (e instanceof Error ? e.message : ""),
      raw,
    };
  }
}
export function useDiary() {
  const [initial] = useState(load);
  const [state, setState] = useState(initial.state);
  const ref = useRef(state);
  ref.current = state;
  const [error, setError] = useState(initial.error);
  const [external, setExternal] = useState(false);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== JSON.stringify(ref.current))
        setExternal(true);
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  function save(next: AppState) {
    if (initial.error)
      throw new Error(
        "Bitte zuerst die beschädigten Daten sichern und zurücksetzen.",
      );
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = validateState(JSON.parse(raw));
      if (stored.revision !== ref.current.revision) {
        setExternal(true);
        throw new Error(
          "Daten wurden in einem anderen Tab geändert. Bitte dessen Stand laden.",
        );
      }
    } else if (external) {
      throw new Error(
        "Daten wurden in einem anderen Tab gelöscht. Bitte Seite neu laden.",
      );
    }
    const result = validateState({
      ...next,
      revision: newId(),
      updatedAt: new Date().toISOString(),
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch {
      setError(
        "Speichern fehlgeschlagen. Bitte Browser-Speicher prüfen und ein Backup exportieren.",
      );
      throw new Error(
        "Speichern fehlgeschlagen. Deine Eingaben bleiben geöffnet.",
      );
    }
    ref.current = result;
    setState(result);
    setError("");
  }
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    const next = blankState();
    ref.current = next;
    setState(next);
    setError("");
    setExternal(false);
    if (initial.error) window.location.reload();
  }
  return {
    state,
    save,
    reset,
    error,
    external,
    raw: initial.raw,
    reload: () => window.location.reload(),
  };
}
