import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, type UserSettings } from '@app-types';
import { storage } from '@storage/index';

/**
 * Shared settings state. AppShell, TrainPage, and SettingsPage all read from
 * here so the header's N-Back selector flows into the game and the settings
 * form. Persists every change to the active StorageAdapter.
 */
export interface SettingsContextValue {
  settings: UserSettings;
  /** Currently selected N. Decoupled from settings.defaultN so the user can
   * change N for a single session without overwriting their preferred default. */
  selectedN: number;
  setSelectedN: (n: number) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  resetSettings: () => void;
  /** True once initial load from storage has completed. */
  loaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [selectedN, setSelectedNState] = useState(DEFAULT_SETTINGS.defaultN);
  const [loaded, setLoaded] = useState(false);
  const userOverrodeNRef = useRef(false);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    void storage.loadSettings().then((loaded) => {
      if (cancelled) return;
      const next = loaded ?? DEFAULT_SETTINGS;
      setSettings(next);
      if (!userOverrodeNRef.current) setSelectedNState(next.defaultN);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      void storage.saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setSelectedNState(DEFAULT_SETTINGS.defaultN);
    userOverrodeNRef.current = false;
    void storage.saveSettings(DEFAULT_SETTINGS);
  }, []);

  const setSelectedN = useCallback((n: number) => {
    userOverrodeNRef.current = true;
    setSelectedNState(n);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, selectedN, setSelectedN, updateSettings, resetSettings, loaded }),
    [settings, selectedN, setSelectedN, updateSettings, resetSettings, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
