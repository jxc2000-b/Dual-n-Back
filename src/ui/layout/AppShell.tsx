import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useSettings } from '@hooks/useSettings';
import './AppShell.css';

const N_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function TitleIcon() {
  // Two outlined squares — matches the icon shown in levelschanged.jpeg.
  return (
    <svg
      className="app-header__icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
    >
      <rect
        x="3.5" y="3.5" width="8" height="8" rx="1.5"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      />
      <rect
        x="12.5" y="12.5" width="8" height="8" rx="1.5"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { selectedN, setSelectedN } = useSettings();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <TitleIcon />
          <span className="app-header__title">Dual N-Back Training</span>
        </div>

        <nav className="app-header__nav">
          <NavLink to="/train">Train</NavLink>
          <NavLink to="/stats">Stats</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        <div className="app-header__controls">
          <span className="app-header__type">
            Type: <span className="app-header__type-value">Dual</span>
          </span>
          <label className="app-header__n">
            <span>N-Back:</span>
            <select
              value={selectedN}
              onChange={(e) => setSelectedN(Number(e.target.value))}
              aria-label="N-Back level"
            >
              {N_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
