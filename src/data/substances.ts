export interface Product {
  id: string;
  name: string;
  doses: number[];
  region?: string;
}
export interface Substance {
  id: string;
  name: string;
  halfLife: number;
  intervalHours: number;
  study?: boolean;
  products: Product[];
  sources: { title: string; url: string; section: string }[];
  verifiedAt: string;
  approximate: true;
}
// Näherungen; offizielle Quellen am 06.11.2026 geprüft. Ausschließlich s.c. Injektionen.
// Fachinformationen: Abschnitte 1 / 4.2 für Präparate- und Dokumentationswerte,
// 5.2 (Elimination) für Halbwertszeiten. Diese Daten sind keine Dosierungsempfehlungen.
const ema = (slug: string, title: string) => ({
  title,
  url: `https://www.ema.europa.eu/en/documents/product-information/${slug}-epar-product-information_en.pdf`,
  section: "1, 4.2 und 5.2 (Elimination; Injektionspräparate)",
});
export const SUBSTANCES: Substance[] = [
  {
    id: "tirzepatide",
    name: "Tirzepatid",
    halfLife: 120,
    intervalHours: 168,
    products: [
      { id: "mounjaro", name: "Mounjaro", doses: [2.5, 5, 7.5, 10, 12.5, 15] },
      {
        id: "zepbound",
        name: "Zepbound",
        region: "USA",
        doses: [2.5, 5, 7.5, 10, 12.5, 15],
      },
    ],
    sources: [
      ema("mounjaro", "EMA · Mounjaro"),
      {
        title: "Lilly · Zepbound Prescribing Information",
        url: "https://pi.lilly.com/us/zepbound-uspi.pdf",
        section: "3 und 12.3; US-Präparateinformation, Stand August 2026",
      },
    ],
    verifiedAt: "2026-11-06",
    approximate: true,
  },
  {
    id: "semaglutide",
    name: "Semaglutid",
    halfLife: 168,
    intervalHours: 168,
    products: [
      { id: "wegovy", name: "Wegovy", doses: [0.25, 0.5, 1, 1.7, 2.4, 7.2] },
      { id: "ozempic", name: "Ozempic", doses: [0.25, 0.5, 1, 2] },
    ],
    sources: [ema("wegovy", "EMA · Wegovy"), ema("ozempic", "EMA · Ozempic")],
    verifiedAt: "2026-11-06",
    approximate: true,
  },
  {
    id: "liraglutide",
    name: "Liraglutid",
    halfLife: 13,
    intervalHours: 24,
    products: [
      { id: "saxenda", name: "Saxenda", doses: [0.6, 1.2, 1.8, 2.4, 3] },
    ],
    sources: [ema("saxenda", "EMA · Saxenda")],
    verifiedAt: "2026-11-06",
    approximate: true,
  },
  {
    id: "dulaglutide",
    name: "Dulaglutid",
    halfLife: 120,
    intervalHours: 168,
    products: [
      { id: "trulicity", name: "Trulicity", doses: [0.75, 1.5, 3, 4.5] },
    ],
    sources: [ema("trulicity", "EMA · Trulicity")],
    verifiedAt: "2026-11-06",
    approximate: true,
  },
  {
    id: "retatrutide",
    name: "Retatrutid",
    halfLife: 144,
    intervalHours: 168,
    study: true,
    products: [{ id: "study", name: "Studiengabe", doses: [] }],
    sources: [
      {
        title: "Lilly · Prüfstatus Retatrutid (Oktober 2026)",
        url: "https://www.lilly.com/news/stories/what-to-know-about-retatrutide",
        section: "FAQ 1–3: in klinischer Prüfung, nicht zugelassen",
      },
      {
        title: "Lilly · TRANSCEND-T2D-1, EASD 2026",
        url: "https://www.lilly.com/hcp/congresses/easd-2026/retatrutide-transcend-t2d-1",
        section:
          "Retatrutide: Novel Triple Receptor Agonist; mittlere Halbwertszeit ca. 6 Tage",
      },
    ],
    verifiedAt: "2026-11-06",
    approximate: true,
  },
];
export const getSubstance = (id: string) => {
  const s = SUBSTANCES.find((s) => s.id === id);
  if (!s) throw new Error("Unbekannter Wirkstoff.");
  return s;
};
export const getProduct = (sid: string, pid: string) => {
  const p = getSubstance(sid).products.find((p) => p.id === pid);
  if (!p) throw new Error("Unbekanntes Präparat.");
  return p;
};
