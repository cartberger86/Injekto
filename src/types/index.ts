import { newId } from "../utils/id";
export type Schedule =
  | { mode: "none" }
  | { mode: "interval"; hours: number }
  | {
      mode: "calendar";
      cadence: "daily" | "weekly";
      time: string;
      weekday: number;
      zone: string;
      anchor: string;
      skipped: string[];
    };
export interface Profile {
  startDate: string;
  startWeight: number;
  targetWeight?: number;
  preferredTime: string;
  zone: string;
  activeEpisodeId: string;
  studyEnabled: boolean;
}
export interface TreatmentMetadata {
  substanceId: string;
  productId: string;
  customSubstanceName?: string;
  customProductName?: string;
  customHalfLifeHours?: number;
  customHalfLifeSource?: string;
}
export interface Episode extends TreatmentMetadata {
  id: string;
  substanceId: string;
  productId: string;
  start: string;
  end?: string;
  schedule: Schedule;
  createdAt: string;
  updatedAt: string;
}
export interface Weight {
  id: string;
  at: string;
  kg: number;
  createdAt: string;
  updatedAt: string;
}
export interface Injection extends TreatmentMetadata {
  id: string;
  episodeId: string;
  substanceId: string;
  productId: string;
  at: string;
  mg: number;
  site: string;
  note: string;
  effects: string;
  createdAt: string;
  updatedAt: string;
}
export interface AppState {
  schemaVersion: 1;
  revision: string;
  updatedAt: string;
  profile: Profile | null;
  episodes: Episode[];
  weights: Weight[];
  injections: Injection[];
}
export const STORAGE_KEY = "injections-diary:v1";
export const blankState = (): AppState => ({
  schemaVersion: 1,
  revision: newId(),
  updatedAt: new Date().toISOString(),
  profile: null,
  episodes: [],
  weights: [],
  injections: [],
});
