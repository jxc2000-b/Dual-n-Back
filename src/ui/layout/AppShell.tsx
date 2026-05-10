import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import './AppShell.css';

// SKELETON — wire the header controls (Type, N-Back selector) to settings/state.
// See PLAN.md → "UI / Layout".

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__title">Dual N-Back Training</div>
        <nav className="app-header__nav">
          <NavLink to="/train">Train</NavLink>
          <NavLink to="/stats">Stats</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        {/* TODO(ui-agent): Type selector ("Dual"), N-back select, mounted on the right per screenshot. */}
        <div className="app-header__controls" />
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
