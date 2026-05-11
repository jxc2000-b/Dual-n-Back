import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameConfig, Position, SetResult, UserSettings } from '@app-types';
import { DEFAULT_SETTINGS } from '@app-types';
import { letterPlayer } from '@audio/letterPlayer';
import { isMatch } from '@engine/sequence';
import { useGameSession } from '@hooks/useGameSession';
import { useSettings } from '@hooks/useSettings';
import { storage } from '@storage/index';
import { Grid } from '@ui/components/Grid';
import { HotkeyButtons } from '@ui/components/HotkeyButtons';
import { SidePanel } from '@ui/components/SidePanel';
import type { SidePanelProps } from '@ui/components/SidePanel';
import { Toast } from '@ui/components/Toast';
import './TrainPage.css';

type Channel = 'position' | 'audio';
type Feedback = 'correct' | 'incorrect';

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatTime(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ms));
}

function buildTodaysPanel(
  sets: SetResult[],
  settings: UserSettings,
  selectedN: number,
): Pick<SidePanelProps, 'next' | 'todaysSets' | 'todaysStats'> {
  const durationSec = Math.round((settings.trialsPerSet * settings.trialDurationMs) / 1000);
  const todaysSets = sets.map((set) => ({
    label: formatTime(set.startedAt),
    percent: Math.round(set.score.combinedAccuracy * 100),
    n: set.config.n,
    durationLabel: formatDuration(set.endedAt - set.startedAt),
  }));

  const firstSet = sets[0];
  const started = firstSet ? formatTime(firstSet.startedAt) : undefined;
  const durationMs = sets.reduce((sum, set) => sum + (set.endedAt - set.startedAt), 0);
  const avgN = sets.length > 0
    ? sets.reduce((sum, set) => sum + set.config.n, 0) / sets.length
    : 0;
  const maxN = sets.length > 0
    ? Math.max(...sets.map((set) => set.config.n))
    : 0;

  return {
    next: {
      level: selectedN,
      trials: settings.trialsPerSet,
      trialSec: settings.trialDurationMs / 1000,
      durationSec,
    },
    todaysSets,
    todaysStats: {
      started,
      durationLabel: formatDuration(durationMs),
      maxN,
      avgN: Number(avgN.toFixed(1)),
    },
  };
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export function TrainPage() {
  const { settings, selectedN, loaded } = useSettings();
  const [pressed, setPressed] = useState<Record<Channel, boolean>>({
    position: false,
    audio: false,
  });
  const [feedback, setFeedback] = useState<Record<Channel, Feedback | null>>({
    position: null,
    audio: null,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [panelData, setPanelData] = useState<
    Pick<SidePanelProps, 'next' | 'todaysSets' | 'todaysStats'>
  >(() => buildTodaysPanel([], DEFAULT_SETTINGS, DEFAULT_SETTINGS.defaultN));

  const playedIndexRef = useRef(-1);
  const savedResultIdsRef = useRef(new Set<string>());
  const pressTimersRef = useRef<Record<Channel, number | null>>({
    position: null,
    audio: null,
  });
  const feedbackTimersRef = useRef<Record<Channel, number | null>>({
    position: null,
    audio: null,
  });
  const evaluatedIndexRef = useRef(-1);
  const previousNRef = useRef<number | null>(null);

  // Sync audio volume whenever it changes (covers initial load + Settings updates).
  useEffect(() => {
    letterPlayer.setVolume(settings.audioVolume);
  }, [settings.audioVolume]);

  const config = useMemo<GameConfig>(() => ({
    n: selectedN,
    trialsPerSet: settings.trialsPerSet,
    trialDurationMs: settings.trialDurationMs,
    stimulusDurationMs: settings.stimulusDurationMs,
    targetMatchRate: 0.3,
  }), [
    selectedN,
    settings.trialsPerSet,
    settings.trialDurationMs,
    settings.stimulusDurationMs,
  ]);

  const { state, start, cancel, press, lastResult } = useGameSession(config);

  const showFeedback = useCallback((channel: Channel, result: Feedback) => {
    setFeedback((current) => ({ ...current, [channel]: result }));

    const existing = feedbackTimersRef.current[channel];
    if (existing != null) window.clearTimeout(existing);
    feedbackTimersRef.current[channel] = window.setTimeout(() => {
      setFeedback((current) => ({ ...current, [channel]: null }));
      feedbackTimersRef.current[channel] = null;
    }, 260);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (previousNRef.current === null) {
      previousNRef.current = selectedN;
      return;
    }
    if (previousNRef.current === selectedN) return;
    previousNRef.current = selectedN;
    setToast('N-Back Level Changed');
  }, [loaded, selectedN]);

  useEffect(() => {
    let cancelled = false;
    void storage.listSets({ sinceMs: startOfTodayMs() }).then((sets) => {
      if (cancelled) return;
      setPanelData(buildTodaysPanel(sets, settings, selectedN));
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, selectedN, settings]);

  useEffect(() => {
    if (!state.stimVisible) return;
    if (state.currentIndex < 0) return;
    if (state.currentIndex === playedIndexRef.current) return;
    const trial = state.trials[state.currentIndex];
    if (!trial) return;
    letterPlayer.play(trial.letter);
    playedIndexRef.current = state.currentIndex;
  }, [state.stimVisible, state.currentIndex, state.trials]);

  useEffect(() => {
    if (!lastResult) return;
    if (savedResultIdsRef.current.has(lastResult.id)) return;
    savedResultIdsRef.current.add(lastResult.id);
    void storage.appendSet(lastResult).then(() => {
      setRefreshKey((key) => key + 1);
    });
  }, [lastResult]);

  useEffect(() => {
    const completedIndex = state.status === 'finished'
      ? state.currentIndex
      : state.currentIndex - 1;
    if (state.status !== 'running' && state.status !== 'finished') return;
    if (completedIndex < state.config.n) return;
    if (completedIndex === evaluatedIndexRef.current) return;

    const response = state.responses[completedIndex];
    if (!response) return;

    evaluatedIndexRef.current = completedIndex;
    (['position', 'audio'] as const).forEach((channel) => {
      if (!response[channel]) return;
      const matched = isMatch(state.trials, completedIndex, state.config.n, channel);
      showFeedback(channel, matched ? 'correct' : 'incorrect');
    });
  }, [
    showFeedback,
    state.config.n,
    state.currentIndex,
    state.responses,
    state.status,
    state.trials,
  ]);

  const handlePress = useCallback((channel: Channel) => {
    press(channel);
    setPressed((current) => ({ ...current, [channel]: true }));

    const existing = pressTimersRef.current[channel];
    if (existing != null) window.clearTimeout(existing);
    pressTimersRef.current[channel] = window.setTimeout(() => {
      setPressed((current) => ({ ...current, [channel]: false }));
      pressTimersRef.current[channel] = null;
    }, 180);
  }, [press]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextEntryTarget(event.target)) return;
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        handlePress('position');
      } else if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        handlePress('audio');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePress]);

  useEffect(() => () => {
    Object.values(pressTimersRef.current).forEach((timer) => {
      if (timer != null) window.clearTimeout(timer);
    });
    Object.values(feedbackTimersRef.current).forEach((timer) => {
      if (timer != null) window.clearTimeout(timer);
    });
  }, []);

  const handleStartCancel = async () => {
    if (state.status === 'running') {
      cancel();
      return;
    }

    playedIndexRef.current = -1;
    evaluatedIndexRef.current = -1;
    setFeedback({ position: null, audio: null });
    try {
      await letterPlayer.resume();
      await letterPlayer.preload();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[audio] unable to preload audio before start', err);
    }
    start();
  };

  const currentTrial = state.trials[state.currentIndex];
  const activeCell: Position | null = state.stimVisible && currentTrial
    ? currentTrial.position
    : null;
  const currentCount = Math.max(0, state.currentIndex + 1);
  const isRunning = state.status === 'running';

  return (
    <div className="train-page">
      <section className="train-page__main">
        <header className="train-page__bar">
          <span className="train-page__counter">
            {currentCount} of {state.trials.length}
          </span>
          <button
            className={`train-page__start${isRunning ? ' train-page__start--cancel' : ''}`}
            type="button"
            onClick={handleStartCancel}
          >
            {isRunning ? 'Cancel' : 'Start'}
          </button>
        </header>

        <Grid activeCell={activeCell} />

        {settings.showHotkeyButtons ? (
          <HotkeyButtons
            onPosition={() => handlePress('position')}
            onAudio={() => handlePress('audio')}
            positionPressed={pressed.position}
            audioPressed={pressed.audio}
            positionFeedback={feedback.position}
            audioFeedback={feedback.audio}
          />
        ) : null}
      </section>

      <SidePanel {...panelData} />
      {toast ? (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  );
}
