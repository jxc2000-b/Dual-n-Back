// Shared types — the contract every module depends on. Keep small, no behavior.

export type Position = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// 8 phonetically distinct consonants (Jaeggi et al. set)
export const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'] as const;
export type Letter = (typeof LETTERS)[number];

export type Channel = 'position' | 'audio';

export interface Trial {
  index: number;
  position: Position;
  letter: Letter;
}

export interface UserResponse {
  position: boolean;
  audio: boolean;
}

export interface GameConfig {
  n: number;
  trialsPerSet: number;
  trialDurationMs: number;
  stimulusDurationMs: number;
  targetMatchRate: number;
}

export interface SetResult {
  id: string;
  startedAt: number;
  endedAt: number;
  config: GameConfig;
  trials: Trial[];
  responses: UserResponse[];
  score: ChannelScore;
}

export interface ChannelScore {
  position: ScoreBreakdown;
  audio: ScoreBreakdown;
  combinedAccuracy: number;
}

export interface ScoreBreakdown {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
  accuracy: number;
}

export interface UserSettings {
  defaultN: number;
  trialsPerSet: number;
  trialDurationMs: number;
  stimulusDurationMs: number;
  audioVolume: number;
  showHotkeyButtons: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultN: 2,
  trialsPerSet: 24,
  trialDurationMs: 3000,
  stimulusDurationMs: 500,
  audioVolume: 0.8,
  showHotkeyButtons: true,
};
