import type { SetResult, UserSettings } from '@app-types';
import type { StorageAdapter } from './adapter';

/**
 * Stub. Implement with @supabase/supabase-js once accounts land. Keeping the
 * interface identical means the UI and engine layers don't change.
 *
 * Suggested schema (all rows scoped by auth.uid()):
 *   user_settings(user_id pk, json)
 *   sets(id pk, user_id, started_at, ended_at, config jsonb, trials jsonb,
 *        responses jsonb, score jsonb)
 */
export class SupabaseAdapter implements StorageAdapter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_client: unknown) {}

  async loadSettings(): Promise<UserSettings | null> {
    throw new Error('SupabaseAdapter.loadSettings: not implemented');
  }
  async saveSettings(_s: UserSettings): Promise<void> {
    throw new Error('SupabaseAdapter.saveSettings: not implemented');
  }
  async appendSet(_set: SetResult): Promise<void> {
    throw new Error('SupabaseAdapter.appendSet: not implemented');
  }
  async listSets(): Promise<SetResult[]> {
    throw new Error('SupabaseAdapter.listSets: not implemented');
  }
  async clearAll(): Promise<void> {
    throw new Error('SupabaseAdapter.clearAll: not implemented');
  }
}
