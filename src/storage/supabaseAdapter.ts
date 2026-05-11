import type { SetResult, UserSettings } from '@app-types';
import type { StorageAdapter } from './adapter';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase-backed adapter. Keeping the interface identical means the UI and
 * engine layers do not need to care whether the user is signed in or using
 * local guest storage.
 *
 * Schema:
 *   user_settings(user_id pk, data jsonb, updated_at timestamptz)
 *   sets(id pk, user_id, started_at, ended_at, config jsonb, trials jsonb,
 *        responses jsonb, score jsonb)
 */
export class SupabaseAdapter implements StorageAdapter {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async loadSettings(): Promise<UserSettings | null> {
    const { data, error } = await this.client
      .from('user_settings')
      .select('data')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) throw error;
    return (data?.data as UserSettings | undefined) ?? null;
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const { error } = await this.client
      .from('user_settings')
      .upsert({
        user_id: this.userId,
        data: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  async appendSet(set: SetResult): Promise<void> {
    const { error } = await this.client
      .from('sets')
      .upsert(toRow(set, this.userId));

    if (error) throw error;
  }

  async listSets(opts?: { sinceMs?: number; limit?: number }): Promise<SetResult[]> {
    let query = this.client
      .from('sets')
      .select('id, started_at, ended_at, config, trials, responses, score')
      .eq('user_id', this.userId)
      .order('started_at', { ascending: false });

    if (opts?.sinceMs != null) {
      query = query.gte('started_at', new Date(opts.sinceMs).toISOString());
    }
    if (opts?.limit != null) {
      query = query.limit(opts.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }

  async clearSets(): Promise<void> {
    const { error } = await this.client
      .from('sets')
      .delete()
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  async clearAll(): Promise<void> {
    await this.clearSets();
    const { error } = await this.client
      .from('user_settings')
      .delete()
      .eq('user_id', this.userId);

    if (error) throw error;
  }
}

interface SetRow {
  id: string;
  user_id?: string;
  started_at: string;
  ended_at: string;
  config: SetResult['config'];
  trials: SetResult['trials'];
  responses: SetResult['responses'];
  score: SetResult['score'];
}

function toRow(set: SetResult, userId: string): SetRow {
  return {
    id: set.id,
    user_id: userId,
    started_at: new Date(set.startedAt).toISOString(),
    ended_at: new Date(set.endedAt).toISOString(),
    config: set.config,
    trials: set.trials,
    responses: set.responses,
    score: set.score,
  };
}

function fromRow(row: SetRow): SetResult {
  return {
    id: row.id,
    startedAt: Date.parse(row.started_at),
    endedAt: Date.parse(row.ended_at),
    config: row.config,
    trials: row.trials,
    responses: row.responses,
    score: row.score,
  };
}
