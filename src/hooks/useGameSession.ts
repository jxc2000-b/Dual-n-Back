import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { GameConfig, SetResult, Trial } from '@app-types';
import { generateSequence } from '@engine/sequence';
import { scoreSet } from '@engine/scoring';
import {
  applyResponse,
  initSession,
  type SessionState,
} from '@engine/session';

type Action =
  | { type: 'start' }
  | { type: 'cancel' }
  | { type: 'tick-show' }
  | { type: 'tick-hide' }
  | { type: 'finish' }
  | { type: 'response'; channel: 'position' | 'audio' }
  | { type: 'reset'; config: GameConfig; trials: Trial[] };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'start':
      return { ...state, status: 'running', currentIndex: -1, startedAt: Date.now() };
    case 'cancel':
      return { ...state, status: 'cancelled', stimVisible: false };
    case 'tick-show':
      return { ...state, currentIndex: state.currentIndex + 1, stimVisible: true };
    case 'tick-hide':
      return { ...state, stimVisible: false };
    case 'finish':
      return { ...state, status: 'finished', stimVisible: false };
    case 'response':
      return applyResponse(state, action.channel);
    case 'reset':
      return initSession(action.config, action.trials);
  }
}

export interface UseGameSession {
  state: SessionState;
  start: () => void;
  cancel: () => void;
  press: (channel: 'position' | 'audio') => void;
  /** Last completed set; null until first run finishes. */
  lastResult: SetResult | null;
}

export function useGameSession(config: GameConfig): UseGameSession {
  const trialsRef = useRef<Trial[]>([]);
  const initial = (() => {
    const t = generateSequence({
      n: config.n,
      trialsPerSet: config.trialsPerSet,
      targetMatchRate: config.targetMatchRate,
    });
    trialsRef.current = t;
    return initSession(config, t);
  })();

  const [state, dispatch] = useReducer(reducer, initial);
  const [lastResult, setLastResult] = useState<SetResult | null>(null);

  // Re-seed when config changes while idle.
  useEffect(() => {
    if (state.status === 'running') return;
    const t = generateSequence({
      n: config.n,
      trialsPerSet: config.trialsPerSet,
      targetMatchRate: config.targetMatchRate,
    });
    trialsRef.current = t;
    dispatch({ type: 'reset', config, trials: t });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.n, config.trialsPerSet, config.trialDurationMs, config.stimulusDurationMs, config.targetMatchRate]);

  // Trial timer loop.
  useEffect(() => {
    if (state.status !== 'running') return;

    let cancelled = false;
    const showTimers: number[] = [];
    const hideTimers: number[] = [];

    for (let i = 0; i < state.trials.length; i++) {
      const t1 = window.setTimeout(() => {
        if (cancelled) return;
        dispatch({ type: 'tick-show' });
      }, i * config.trialDurationMs);
      const t2 = window.setTimeout(() => {
        if (cancelled) return;
        dispatch({ type: 'tick-hide' });
      }, i * config.trialDurationMs + config.stimulusDurationMs);
      showTimers.push(t1);
      hideTimers.push(t2);
    }

    const finishTimer = window.setTimeout(() => {
      if (cancelled) return;
      dispatch({ type: 'finish' });
    }, state.trials.length * config.trialDurationMs);

    return () => {
      cancelled = true;
      showTimers.forEach(clearTimeout);
      hideTimers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
  }, [state.status, state.trials, config.trialDurationMs, config.stimulusDurationMs]);

  // On finish, build the result.
  useEffect(() => {
    if (state.status !== 'finished') return;
    const score = scoreSet(state.trials, state.responses, state.config.n);
    setLastResult({
      id: `set-${state.startedAt}`,
      startedAt: state.startedAt,
      endedAt: Date.now(),
      config: state.config,
      trials: state.trials,
      responses: state.responses,
      score,
    });
  }, [state.status, state.trials, state.responses, state.config, state.startedAt]);

  const start = useCallback(() => {
    const t = generateSequence({
      n: config.n,
      trialsPerSet: config.trialsPerSet,
      targetMatchRate: config.targetMatchRate,
    });
    trialsRef.current = t;
    dispatch({ type: 'reset', config, trials: t });
    dispatch({ type: 'start' });
  }, [config]);
  const cancel = useCallback(() => dispatch({ type: 'cancel' }), []);
  const press = useCallback(
    (channel: 'position' | 'audio') => dispatch({ type: 'response', channel }),
    [],
  );

  return { state, start, cancel, press, lastResult };
}
