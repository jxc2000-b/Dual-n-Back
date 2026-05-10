import type { SetResult } from '@app-types';
import type { DailyRollup } from './adapter';

function dateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function rollupByDay(sets: readonly SetResult[]): DailyRollup[] {
  const buckets = new Map<string, SetResult[]>();
  for (const s of sets) {
    const k = dateKey(s.startedAt);
    const arr = buckets.get(k) ?? [];
    arr.push(s);
    buckets.set(k, arr);
  }

  const out: DailyRollup[] = [];
  for (const [k, arr] of buckets) {
    const durationMs = arr.reduce((a, s) => a + (s.endedAt - s.startedAt), 0);
    const ns = arr.map((s) => s.config.n);
    const accs = arr.map((s) => s.score.combinedAccuracy);
    out.push({
      dateKey: k,
      sets: arr.length,
      durationMs,
      maxN: Math.max(...ns),
      avgN: ns.reduce((a, b) => a + b, 0) / ns.length,
      avgAccuracy: accs.reduce((a, b) => a + b, 0) / accs.length,
    });
  }
  out.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return out;
}
