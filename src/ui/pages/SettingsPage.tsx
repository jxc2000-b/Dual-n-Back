import { useState, type ChangeEvent } from 'react';
import { DEFAULT_SETTINGS, type UserSettings } from '@app-types';
import { letterPlayer } from '@audio/letterPlayer';
import { useSettings } from '@hooks/useSettings';
import { storage } from '@storage/index';
import './SettingsPage.css';

type NumericField = 'defaultN' | 'trialsPerSet' | 'trialDurationMs' | 'stimulusDurationMs';

interface FieldSpec {
  key: NumericField;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: FieldSpec[] = [
  { key: 'defaultN', label: 'Default N-Back', hint: '1–9', min: 1, max: 9, step: 1 },
  { key: 'trialsPerSet', label: 'Trials per set', hint: '8–60', min: 8, max: 60, step: 1 },
  { key: 'trialDurationMs', label: 'Trial duration (ms)', hint: '1500–6000', min: 1500, max: 6000, step: 100 },
  { key: 'stimulusDurationMs', label: 'Stimulus duration (ms)', hint: '200–1500', min: 200, max: 1500, step: 50 },
];

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings, loaded } = useSettings();
  const [drafts, setDrafts] = useState<Record<NumericField, string>>({
    defaultN: '',
    trialsPerSet: '',
    trialDurationMs: '',
    stimulusDurationMs: '',
  });
  const [savedFlash, setSavedFlash] = useState<keyof UserSettings | null>(null);

  function flashSaved(key: keyof UserSettings) {
    setSavedFlash(key);
    window.setTimeout(() => setSavedFlash((cur) => (cur === key ? null : cur)), 900);
  }

  function fieldValue(spec: FieldSpec): string {
    const draft = drafts[spec.key];
    if (draft !== '') return draft;
    return String(settings[spec.key]);
  }

  function onFieldChange(spec: FieldSpec, e: ChangeEvent<HTMLInputElement>) {
    setDrafts((d) => ({ ...d, [spec.key]: e.target.value }));
  }

  function onFieldCommit(spec: FieldSpec) {
    const raw = drafts[spec.key];
    if (raw === '') return;
    const parsed = clamp(Math.round(Number(raw)), spec.min, spec.max);
    setDrafts((d) => ({ ...d, [spec.key]: '' }));
    if (parsed !== settings[spec.key]) {
      updateSettings({ [spec.key]: parsed } as Partial<UserSettings>);
      flashSaved(spec.key);
    }
  }

  function onVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const v = clamp(Number(e.target.value), 0, 1);
    letterPlayer.setVolume(v);
    updateSettings({ audioVolume: v });
  }

  function onToggleHotkeys(e: ChangeEvent<HTMLInputElement>) {
    updateSettings({ showHotkeyButtons: e.target.checked });
    flashSaved('showHotkeyButtons');
  }

  function onReset() {
    if (!window.confirm('Reset all settings to defaults? This will not delete your training history.')) return;
    resetSettings();
    setDrafts({ defaultN: '', trialsPerSet: '', trialDurationMs: '', stimulusDurationMs: '' });
  }

  async function onClearHistory() {
    if (!window.confirm('Permanently delete all training history? Settings will be kept.')) return;
    await storage.clearSets();
    window.alert('Training history cleared.');
  }

  return (
    <div className="settings-page">
      <h2 className="settings-page__heading">Settings</h2>
      {!loaded ? <p className="settings-page__muted">Loading…</p> : null}

      <section className="settings-page__section">
        <h3>Game</h3>
        <div className="settings-page__grid">
          {FIELDS.map((spec) => (
            <label key={spec.key} className="settings-page__row">
              <span className="settings-page__label">
                {spec.label}
                <span className="settings-page__hint">{spec.hint}</span>
              </span>
              <span className="settings-page__control">
                <input
                  type="number"
                  inputMode="numeric"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={fieldValue(spec)}
                  onChange={(e) => onFieldChange(spec, e)}
                  onBlur={() => onFieldCommit(spec)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                />
                {savedFlash === spec.key ? (
                  <span className="settings-page__saved" aria-live="polite">Saved</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-page__section">
        <h3>Audio</h3>
        <label className="settings-page__row">
          <span className="settings-page__label">
            Volume
            <span className="settings-page__hint">0–100%</span>
          </span>
          <span className="settings-page__control">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.audioVolume}
              onChange={onVolumeChange}
              aria-label="Audio volume"
            />
            <span className="settings-page__value">
              {Math.round(settings.audioVolume * 100)}%
            </span>
          </span>
        </label>
      </section>

      <section className="settings-page__section">
        <h3>Interface</h3>
        <label className="settings-page__row settings-page__row--toggle">
          <span className="settings-page__label">
            Show hotkey buttons
            <span className="settings-page__hint">A: Position / L: Audio under the grid</span>
          </span>
          <span className="settings-page__control">
            <input
              type="checkbox"
              checked={settings.showHotkeyButtons}
              onChange={onToggleHotkeys}
            />
            {savedFlash === 'showHotkeyButtons' ? (
              <span className="settings-page__saved" aria-live="polite">Saved</span>
            ) : null}
          </span>
        </label>
      </section>

      <section className="settings-page__section settings-page__section--danger">
        <h3>Danger zone</h3>
        <div className="settings-page__actions">
          <button
            type="button"
            className="settings-page__btn"
            onClick={onReset}
          >
            Reset to defaults
          </button>
          <button
            type="button"
            className="settings-page__btn settings-page__btn--danger"
            onClick={onClearHistory}
          >
            Clear training history
          </button>
        </div>
        <p className="settings-page__muted">
          Defaults: N {DEFAULT_SETTINGS.defaultN}, {DEFAULT_SETTINGS.trialsPerSet} trials,{' '}
          {DEFAULT_SETTINGS.trialDurationMs}ms / trial.
        </p>
      </section>
    </div>
  );
}
