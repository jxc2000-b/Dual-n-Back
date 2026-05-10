import { DEFAULT_SETTINGS, type SetResult, type UserSettings } from '@app-types';
import type { StorageAdapter } from './adapter';

const KEY_SETTINGS = 'dnb.settings.v1';
const KEY_SETS = 'dnb.sets.v1';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export class LocalStorageAdapter implements StorageAdapter {
  async loadSettings(): Promise<UserSettings> {
    return safeParse<UserSettings>(localStorage.getItem(KEY_SETTINGS), DEFAULT_SETTINGS);
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  }

  async appendSet(set: SetResult): Promise<void> {
    const sets = safeParse<SetResult[]>(localStorage.getItem(KEY_SETS), []);
    sets.push(set);
    localStorage.setItem(KEY_SETS, JSON.stringify(sets));
  }

  async listSets(opts?: { sinceMs?: number; limit?: number }): Promise<SetResult[]> {
    let sets = safeParse<SetResult[]>(localStorage.getItem(KEY_SETS), []);
    if (opts?.sinceMs != null) sets = sets.filter((s) => s.startedAt >= opts.sinceMs!);
    if (opts?.limit != null) sets = sets.slice(-opts.limit);
    return sets;
  }

  async clearSets(): Promise<void> {
    localStorage.removeItem(KEY_SETS);
  }

  async clearAll(): Promise<void> {
    localStorage.removeItem(KEY_SETTINGS);
    localStorage.removeItem(KEY_SETS);
  }
}
