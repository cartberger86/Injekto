import type { TreatmentMetadata } from "../types";
import { getSubstance, getProduct } from "../data/substances";
export const isCustomSubstance = (id: string) => id.startsWith("custom:");
export function treatmentSubstance(record: TreatmentMetadata) {
  if (!isCustomSubstance(record.substanceId))
    return { ...getSubstance(record.substanceId), custom: false };
  return {
    id: record.substanceId,
    name: record.customSubstanceName?.trim() || "Eigener Wirkstoff",
    halfLife: record.customHalfLifeHours ?? null,
    intervalHours: null,
    custom: true,
    study: false,
    products: [],
    sources: [],
    verifiedAt: null,
    approximate: true,
  };
}
export function treatmentProduct(record: TreatmentMetadata) {
  if (record.productId === "custom")
    return {
      id: "custom",
      name: record.customProductName?.trim() || "Eigene Präparatebezeichnung",
      doses: [] as number[],
    };
  return getProduct(record.substanceId, record.productId);
}
export function metadataOf(record: TreatmentMetadata): TreatmentMetadata {
  return {
    substanceId: record.substanceId,
    productId: record.productId,
    ...(record.customSubstanceName
      ? { customSubstanceName: record.customSubstanceName.trim() }
      : {}),
    ...(record.customProductName
      ? { customProductName: record.customProductName.trim() }
      : {}),
    ...(record.customHalfLifeHours !== undefined
      ? { customHalfLifeHours: record.customHalfLifeHours }
      : {}),
    ...(record.customHalfLifeSource
      ? { customHalfLifeSource: record.customHalfLifeSource.trim() }
      : {}),
  };
}
export function validateTreatment(record: TreatmentMetadata) {
  if (isCustomSubstance(record.substanceId)) {
    if (!record.customSubstanceName?.trim())
      throw new Error("Bitte den eigenen Wirkstoff benennen.");
    if (record.productId !== "custom")
      throw new Error(
        "Für einen eigenen Wirkstoff bitte eine eigene Präparatebezeichnung verwenden.",
      );
    if (
      record.customHalfLifeHours !== undefined &&
      (!Number.isFinite(record.customHalfLifeHours) ||
        record.customHalfLifeHours <= 0)
    )
      throw new Error(
        "Eine hinterlegte Halbwertszeit muss eine positive Zahl sein.",
      );
  } else {
    getSubstance(record.substanceId);
    if (
      record.customSubstanceName ||
      record.customHalfLifeHours !== undefined ||
      record.customHalfLifeSource
    )
      throw new Error(
        "Eigene Modellparameter sind nur bei eigenen Wirkstoffen zulässig.",
      );
  }
  if (record.productId === "custom") {
    if (!record.customProductName?.trim())
      throw new Error("Bitte die eigene Präparatebezeichnung eingeben.");
  } else {
    getProduct(record.substanceId, record.productId);
    if (record.customProductName)
      throw new Error("Freier Präparatename passt nicht zur Präparateauswahl.");
  }
}
export function sameModel(a: TreatmentMetadata, b: TreatmentMetadata) {
  return (
    a.substanceId === b.substanceId &&
    a.customSubstanceName?.trim() === b.customSubstanceName?.trim() &&
    a.customHalfLifeHours === b.customHalfLifeHours
  );
}
