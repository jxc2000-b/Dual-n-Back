import type { GameConfig, Trial, UserResponse } from '@app-types';

export type SessionStatus = 'idle' | 'running' | 'finished' | 'cancelled';

export interface SessionState {
  status: SessionStatus;
  config: GameConfig;
  trials: Trial[];
  currentIndex: number;
  responses: UserResponse[];
  /** Whether the visual stim is currently rendered on the grid. */
  stimVisible: boolean;
  startedAt: number;
}

export function blankResponses(n: number): UserResponse[] {
  return Array.from({ length: n }, () => ({ position: false, audio: false }));
}

export function initSession(config: GameConfig, trials: Trial[]): SessionState {
  return {
    status: 'idle',
    config,
    trials,
    currentIndex: -1,
    responses: blankResponses(trials.length),
    stimVisible: false,
    startedAt: 0,
  };
}

/**
 * Pure response merging — we OR responses within a trial so a user can hit A
 * then L (or vice versa) without losing the earlier press.
 */
export function applyResponse(
  state: SessionState,
  channel: 'position' | 'audio',
): SessionState {
  if (state.status !== 'running' || state.currentIndex < 0) return state;
  const next = state.responses.slice();
  const cur = next[state.currentIndex] ?? { position: false, audio: false };
  next[state.currentIndex] = { ...cur, [channel]: true };
  return { ...state, responses: next };
}
