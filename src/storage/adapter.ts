import type { SetResult, UserSettings } from '@app-types';

/**
 * One adapter, two backends. LocalStorageAdapter ships now; SupabaseAdapter
 * implements the same interface later without UI changes.
 */
export interface StorageAdapter {
  loadSettings(): Promise<UserSettings | null>;
  saveSettings(settings: UserSettings): Promise<void>;

  appendSet(set: SetResult): Promise<void>;
  listSets(opts?: { sinceMs?: number; limit?: number }): Promise<SetResult[]>;
  clearAll(): Promise<void>;
}

export interface DailyRollup {
  dateKey: string; // YYYY-MM-DD in local tz
  sets: number;
  durationMs: number;
  maxN: number;
  avgN: number;
  avgAccuracy: number;
}
