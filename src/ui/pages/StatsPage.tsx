import { useEffect, useMemo, useState } from 'react';
import type { SetResult } from '@app-types';
import type { DailyRollup } from '@storage/index';
import { rollupByDay } from '@storage/aggregate';
import { storage } from '@storage/index';
import './StatsPage.css';

type FilterKey = 'today' | 'week' | 'month' | 'all';

interface FilterOption {
  key: FilterKey;
  label: string;
  sinceMs: () => number | null;
}

const FILTERS: FilterOption[] = [
  {
    key: 'today',
    label: 'Today',
    sinceMs: () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    },
  },
  {
    key: 'week',
    label: '7d',
    sinceMs: () => Date.now() - (7 * 24 * 60 * 60 * 1000),
  },
  {
    key: 'month',
    label: '30d',
    sinceMs: () => Date.now() - (30 * 24 * 60 * 60 * 1000),
  },
  {
    key: 'all',
    label: 'All',
    sinceMs: () => null,
  },
];
const DEFAULT_FILTER: FilterOption = FILTERS[0] as FilterOption;

function formatDateTime(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ms));
}

function formatDay(dateKey: string): string {
  const [year = 1970, month = 1, day = 1] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

function Sparkline({
  values,
  label,
  valueLabel,
}: {
  values: readonly number[];
  label: string;
  valueLabel: (value: number) => string;
}) {
  const width = 160;
  const height = 44;
  const pad = 4;
  const latest = values.at(-1);

  if (values.length === 0) {
    return (
      <div className="stats-sparkline" aria-label={`${label}: no data`}>
        <span className="stats-sparkline__label">{label}</span>
        <div className="stats-sparkline__empty">No data</div>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = values.length === 1
      ? width / 2
      : pad + (index / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return (
    <div className="stats-sparkline">
      <span className="stats-sparkline__label">{label}</span>
      <svg
        className="stats-sparkline__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label}, latest ${latest == null ? 'none' : valueLabel(latest)}`}
      >
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="stats-sparkline__value">
        {latest == null ? '-' : valueLabel(latest)}
      </span>
    </div>
  );
}

export function StatsPage() {
  const [sets, setSets] = useState<SetResult[]>([]);
  const [filter, setFilter] = useState<FilterKey>('today');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void storage.listSets().then((history) => {
      if (cancelled) return;
      setSets(history);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilter = FILTERS.find((option) => option.key === filter) ?? DEFAULT_FILTER;
  const filteredSets = useMemo(() => {
    const sinceMs = activeFilter.sinceMs();
    return sets
      .filter((set) => sinceMs == null || set.startedAt >= sinceMs)
      .sort((a, b) => b.startedAt - a.startedAt);
  }, [activeFilter, sets]);

  const rollups = useMemo(
    () => rollupByDay(filteredSets).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    [filteredSets],
  );
  const rollupsAscending = useMemo(
    () => [...rollups].reverse(),
    [rollups],
  );
  const totalSets = filteredSets.length;
  const totalDurationMs = filteredSets.reduce((sum, set) => sum + (set.endedAt - set.startedAt), 0);
  const avgAccuracy = totalSets > 0
    ? filteredSets.reduce((sum, set) => sum + set.score.combinedAccuracy, 0) / totalSets
    : 0;
  const maxN = totalSets > 0 ? Math.max(...filteredSets.map((set) => set.config.n)) : 0;

  return (
    <div className="stats-page">
      <header className="stats-page__header">
        <div>
          <h2>Stats</h2>
          <p>Review set history, daily rollups, and recent trends.</p>
        </div>
        <div className="stats-filters" aria-label="Stats time range">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              className={`stats-filters__chip${filter === option.key ? ' stats-filters__chip--active' : ''}`}
              type="button"
              onClick={() => setFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <section className="stats-summary" aria-label="Summary">
        <div className="stats-summary__item">
          <span className="stats-summary__label">Sets</span>
          <strong>{totalSets}</strong>
        </div>
        <div className="stats-summary__item">
          <span className="stats-summary__label">Max N</span>
          <strong>{maxN || '-'}</strong>
        </div>
        <div className="stats-summary__item">
          <span className="stats-summary__label">Avg Accuracy</span>
          <strong>{totalSets ? formatPercent(avgAccuracy) : '-'}</strong>
        </div>
        <div className="stats-summary__item">
          <span className="stats-summary__label">Training Time</span>
          <strong>{totalSets ? formatDuration(totalDurationMs) : '-'}</strong>
        </div>
      </section>

      <section className="stats-trends" aria-label="Trends">
        <Sparkline
          label="Avg N"
          values={rollupsAscending.map((rollup) => rollup.avgN)}
          valueLabel={formatNumber}
        />
        <Sparkline
          label="Avg Accuracy"
          values={rollupsAscending.map((rollup) => rollup.avgAccuracy)}
          valueLabel={formatPercent}
        />
      </section>

      <section className="stats-section">
        <header className="stats-section__header">
          <h3>Daily Rollup</h3>
        </header>
        {loaded && rollups.length === 0 ? (
          <p className="stats-empty">{sets.length === 0 ? 'No sets recorded yet — go train.' : 'No sets in this window.'}</p>
        ) : (
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sets</th>
                  <th>Max N</th>
                  <th>Avg N</th>
                  <th>Avg Accuracy</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {rollups.map((rollup: DailyRollup) => (
                  <tr key={rollup.dateKey}>
                    <td>{formatDay(rollup.dateKey)}</td>
                    <td>{rollup.sets}</td>
                    <td>{rollup.maxN}</td>
                    <td>{formatNumber(rollup.avgN)}</td>
                    <td>{formatPercent(rollup.avgAccuracy)}</td>
                    <td>{formatDuration(rollup.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stats-section">
        <header className="stats-section__header">
          <h3>History</h3>
        </header>
        {loaded && filteredSets.length === 0 ? (
          <p className="stats-empty">{sets.length === 0 ? 'No sets recorded yet — go train.' : 'No sets in this window.'}</p>
        ) : (
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>N</th>
                  <th>Accuracy</th>
                  <th>Trials</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredSets.map((set) => (
                  <tr key={set.id}>
                    <td>{formatDateTime(set.startedAt)}</td>
                    <td>D2B</td>
                    <td>{set.config.n}</td>
                    <td>{formatPercent(set.score.combinedAccuracy)}</td>
                    <td>{set.trials.length}</td>
                    <td>{formatDuration(set.endedAt - set.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
