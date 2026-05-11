import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useSettings } from '@hooks/useSettings';
import './AppShell.css';


const N_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;


export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { selectedN, setSelectedN } = useSettings();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          
          <span className="app-header__title">Dual N-Back Training</span>
        </div>

        <nav className="app-header__nav">
          <NavLink to="/train">Train</NavLink>
          <NavLink to="/stats">Stats</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/login">{user ? 'Account' : 'Login'}</NavLink>
        </nav>

        <div className="app-header__controls">
          {user ? (
            <button className="app-header__account" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
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
