import { describe, it, expect } from "vitest";
import type { AppState, TreatmentMetadata } from "../src/types";
import {
  metadataOf,
  sameModel,
  treatmentProduct,
  treatmentSubstance,
  validateTreatment,
} from "../src/utils/treatment";
import {
  csvExport,
  jsonExport,
  parseImport,
  validateState,
} from "../src/utils/importExport";
import { writeFileBackup } from "../src/utils/fileBackup";
import type { BackupHandle } from "../src/utils/fileBackup";
import { nextScheduled, projectFuture } from "../src/utils/schedule";
function sample(): AppState {
  const t = "2026-01-01T12:00:00Z";
  return {
    schemaVersion: 1,
    revision: "rev1",
    updatedAt: t,
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
        site: "",
        note: "",
        effects: "",
        createdAt: t,
        updatedAt: t,
      },
    ],
    weights: [],
  };
}
describe("Eigene Bezeichnungen und Bestandsdaten", () => {
  it("liest unveränderte ältere Browserdaten und alte JSON-Exportnamen", () => {
    const s = sample();
    expect(validateState(s)).toEqual(s);
    expect(
      parseImport(JSON.stringify({ format: "InjektionsTagebuch", data: s })),
    ).toEqual(s);
    expect(parseImport(jsonExport(s))).toEqual(s);
  });
  it("verbindet einen bekannten Wirkstoff mit einem freien Präparatenamen ohne eigenes Dosisschema", () => {
    const m = {
      substanceId: "tirzepatide",
      productId: "custom",
      customProductName: "PetersPeptide",
    };
    expect(() => validateTreatment(m)).not.toThrow();
    expect(treatmentSubstance(m).halfLife).toBe(120);
    expect(treatmentProduct(m)).toMatchObject({
      name: "PetersPeptide",
      doses: [],
    });
    expect(sameModel(m, sample().episodes[0])).toBe(true);
  });
  it("erhält die frühere Präparatebezeichnung beim Wechsel innerhalb desselben Wirkstoffs", () => {
    const s = sample();
    s.episodes[0] = {
      ...s.episodes[0],
      productId: "custom",
      customProductName: "Eigene Bezeichnung",
    };
    const parsed = validateState(s);
    expect(treatmentProduct(parsed.injections[0]).name).toBe("Mounjaro");
    expect(treatmentProduct(parsed.episodes[0]).name).toBe(
      "Eigene Bezeichnung",
    );
  });
  it("leitet aus einem eigenen Namen keine Halbwertszeit oder Standardfrequenz ab", () => {
    const m = {
      substanceId: "custom:one",
      productId: "custom",
      customSubstanceName: "Tirzepatid",
      customProductName: "Eigener Eintrag",
    };
    expect(treatmentSubstance(m).halfLife).toBeNull();
    expect(treatmentSubstance(m).intervalHours).toBeNull();
    expect(nextScheduled({ mode: "none" }, [])).toBeNull();
    expect(
      projectFuture({ mode: "none" }, [], Date.now(), Date.now() + 10000),
    ).toEqual([]);
  });
  it("bewahrt eigene Modellparameter und Namen in JSON und CSV", () => {
    const s = sample();
    const m: TreatmentMetadata = {
      substanceId: "custom:one",
      productId: "custom",
      customSubstanceName: "Eigener Wirkstoff",
      customProductName: "Eigener Name",
      customHalfLifeHours: 42,
      customHalfLifeSource: "Eigene Quellenangabe",
    };
    s.episodes[0] = { ...s.episodes[0], ...m };
    s.injections[0] = { ...s.injections[0], ...m };
    const result = parseImport(jsonExport(s));
    expect(metadataOf(result.injections[0])).toEqual(m);
    expect(csvExport(result, "injections")).toContain("Eigener Wirkstoff");
    expect(csvExport(result, "injections")).toContain("Eigener Name");
  });
  it("behandelt Änderungen eigener Modellparameter als neue Modellidentität", () => {
    const a = {
      substanceId: "custom:one",
      productId: "custom",
      customSubstanceName: "Eigener Wirkstoff",
      customProductName: "A",
      customHalfLifeHours: 42,
    };
    expect(sameModel(a, { ...a, customProductName: "B" })).toBe(true);
    expect(sameModel(a, { ...a, customHalfLifeHours: 24 })).toBe(false);
  });
  it("weist fehlende Namen, falsche Modellzuordnung und abweichende Parameter in historischen Injektionen zurück", () => {
    expect(() =>
      validateTreatment({ substanceId: "custom:one", productId: "custom" }),
    ).toThrow();
    expect(() =>
      validateTreatment({
        substanceId: "tirzepatide",
        productId: "custom",
        customProductName: "X",
        customHalfLifeHours: 5,
      }),
    ).toThrow();
    const s = sample(),
      m = {
        substanceId: "custom:one",
        productId: "custom",
        customSubstanceName: "X",
        customProductName: "Y",
        customHalfLifeHours: 42,
      };
    s.episodes[0] = { ...s.episodes[0], ...m };
    s.injections[0] = { ...s.injections[0], ...m, customHalfLifeHours: 24 };
    expect(() => validateState(s)).toThrow();
  });
});
function fakeHandle(
  text: string,
  permission: PermissionState = "granted",
  failWrite = false,
) {
  let body = text,
    writes = 0,
    aborted = false;
  const handle: BackupHandle = {
    name: "Test-Sicherung.json",
    getFile: async () => new File([body], "Test-Sicherung.json"),
    queryPermission: async () => permission,
    requestPermission: async () => permission,
    createWritable: async () => {
      let pending = "";
      return {
        write: async (v: string) => {
          writes++;
          if (failWrite) throw new Error("Dateisystem voll");
          pending = v;
        },
        close: async () => {
          body = pending;
        },
        abort: async () => {
          aborted = true;
        },
      };
    },
  };
  return {
    handle,
    body: () => body,
    writes: () => writes,
    aborted: () => aborted,
  };
}
describe("Zusätzliche Dateisicherung", () => {
  it("erkennt auch manuelle Inhaltsänderungen bei unveränderter Revisions-ID", async () => {
    const state = sample(),
      initial = fakeHandle("");
    const first = await writeFileBackup(initial.handle, state, "", true);
    const modified = {
      ...state,
      profile: { ...state.profile!, startWeight: 95 },
    };
    const other = fakeHandle(jsonExport(modified));
    await expect(
      writeFileBackup(
        other.handle,
        { ...state, revision: "rev2" },
        state.revision,
        false,
        first.lastFingerprint,
      ),
    ).rejects.toThrow("außerhalb");
    expect(other.writes()).toBe(0);
  });

  it("aktualisiert dieselbe verknüpfte Datei nach einem bestätigten neuen Stand", async () => {
    const s = sample(),
      f = fakeHandle(jsonExport(s));
    const next = {
      ...s,
      revision: "rev2",
      weights: [
        {
          id: "w1",
          at: s.updatedAt,
          kg: 99,
          createdAt: s.updatedAt,
          updatedAt: s.updatedAt,
        },
      ],
    };
    const r = await writeFileBackup(f.handle, next, s.revision);
    expect(parseImport(f.body())).toEqual(next);
    expect(r.lastRevision).toBe("rev2");
    expect(f.writes()).toBe(1);
  });
  it("überschreibt keine außerhalb der App geänderte Sicherung", async () => {
    const s = sample(),
      f = fakeHandle(jsonExport({ ...s, revision: "foreign" }));
    const before = f.body();
    await expect(
      writeFileBackup(f.handle, { ...s, revision: "rev2" }, s.revision),
    ).rejects.toThrow("außerhalb");
    expect(f.body()).toBe(before);
    expect(f.writes()).toBe(0);
  });
  it("überschreibt keine beschädigte Datei ohne ausdrückliche Ersetzung", async () => {
    const s = sample(),
      f = fakeHandle("nicht JSON");
    await expect(writeFileBackup(f.handle, s, s.revision)).rejects.toThrow();
    expect(f.writes()).toBe(0);
    await writeFileBackup(f.handle, s, s.revision, true);
    expect(parseImport(f.body())).toEqual(s);
  });
  it("meldet fehlenden Dateizugriff ohne zu schreiben", async () => {
    const s = sample(),
      f = fakeHandle(jsonExport(s), "prompt");
    await expect(writeFileBackup(f.handle, s, s.revision)).rejects.toThrow(
      "Dateizugriff",
    );
    expect(f.writes()).toBe(0);
  });
  it("bricht bei Schreibfehlern ab und meldet keinen erfolgreichen Sicherungsstand", async () => {
    const s = sample(),
      f = fakeHandle(jsonExport(s), "granted", true),
      before = f.body();
    await expect(
      writeFileBackup(f.handle, { ...s, revision: "rev2" }, s.revision),
    ).rejects.toThrow("voll");
    expect(f.aborted()).toBe(true);
    expect(f.body()).toBe(before);
  });
});
