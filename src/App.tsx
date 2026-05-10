import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './ui/layout/AppShell';
import { TrainPage } from './ui/pages/TrainPage';
import { StatsPage } from './ui/pages/StatsPage';
import { SettingsPage } from './ui/pages/SettingsPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/train" replace />} />
        <Route path="/train" element={<TrainPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/train" replace />} />
      </Routes>
    </AppShell>
  );
}
