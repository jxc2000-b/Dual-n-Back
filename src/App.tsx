import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { SettingsProvider } from '@hooks/useSettings';
import { AppShell } from './ui/layout/AppShell';
import { LoginPage } from './ui/pages/LoginPage';
import { TrainPage } from './ui/pages/TrainPage';
import { StatsPage } from './ui/pages/StatsPage';
import { SettingsPage } from './ui/pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/train" replace />} />
            <Route path="/train" element={<TrainPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/train" replace />} />
          </Routes>
        </AppShell>
      </SettingsProvider>
    </AuthProvider>
  );
}
