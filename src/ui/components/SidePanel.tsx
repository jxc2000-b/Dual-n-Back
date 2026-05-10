import './SidePanel.css';

// SKELETON — right-side panel from postsetstatistics.jpeg. UI agent: bind
// real data via useSidePanelData hook (to be written) — pulls from storage.

export interface SidePanelProps {
  /** Next set summary — derived from current settings. */
  next?: {
    level: number;
    trials: number;
    trialSec: number;
    durationSec: number;
  };
  /** Today's set rows: {label, percent, n, durationLabel}. */
  todaysSets?: Array<{
    label: string;
    percent: number;
    n: number;
    durationLabel: string;
  }>;
  /** Today's running stats. */
  todaysStats?: {
    started?: string;
    durationLabel: string;
    maxN: number;
    avgN: number;
  };
}

export function SidePanel({ next, todaysSets = [], todaysStats }: SidePanelProps) {
  return (
    <aside className="side-panel">
      <section className="side-panel__section">
        <h3>Next Set</h3>
        <dl>
          <dt>Level</dt><dd>{next?.level ?? '—'}</dd>
          <dt>Number of Trials</dt><dd>{next?.trials ?? '—'}</dd>
          <dt>Trial Time</dt><dd>{next ? `${next.trialSec} s.` : '—'}</dd>
          <dt>Set Duration</dt><dd>{next ? `${next.durationSec} s.` : '—'}</dd>
        </dl>
      </section>

      <section className="side-panel__section">
        <h3>Today's Sets</h3>
        {todaysSets.length === 0 ? (
          <p className="side-panel__muted">No sets yet today.</p>
        ) : (
          <ol className="side-panel__sets">
            {todaysSets.map((s, i) => (
              <li key={i}>
                <span>{i + 1}.</span>
                <span>{s.label}</span>
                <span>{s.percent}%</span>
                <span>{s.n}</span>
                <span>{s.durationLabel}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="side-panel__section">
        <h3>Today's Statistics</h3>
        <dl>
          <dt>Started:</dt><dd>{todaysStats?.started ?? '—'}</dd>
          <dt>Duration:</dt><dd>{todaysStats?.durationLabel ?? '—'}</dd>
          <dt>Max:</dt><dd>{todaysStats?.maxN ?? '—'}</dd>
          <dt>Avg:</dt><dd>{todaysStats?.avgN ?? '—'}</dd>
        </dl>
      </section>
    </aside>
  );
}
