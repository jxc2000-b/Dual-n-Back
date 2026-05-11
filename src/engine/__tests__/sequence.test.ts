import { describe, it, expect } from 'vitest';
import { generateSequence, isMatch, countMatches } from '../sequence';
import type { Rng } from '../rng';

/** Seeded RNG (simple LCG) for deterministic tests. */
function seededRng(seed: number): Rng {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

describe('generateSequence', () => {
  it('generates the requested number of trials', () => {
    const seq = generateSequence({
      n: 2,
      trialsPerSet: 30,
      targetMatchRate: 0.3,
      rng: seededRng(42),
    });
    expect(seq).toHaveLength(30);
  });

  it('does not produce matches for the first n trials', () => {
    const seq = generateSequence({
      n: 2,
      trialsPerSet: 20,
      targetMatchRate: 0.3,
      rng: seededRng(42),
    });

    // First n trials have nothing n-back to match against
    for (let i = 0; i < 2; i++) {
      expect(isMatch(seq, i, 2, 'position')).toBe(false);
      expect(isMatch(seq, i, 2, 'audio')).toBe(false);
    }
  });

  it('assigns every trial a valid position (0-8) and letter', () => {
    const seq = generateSequence({
      n: 3,
      trialsPerSet: 50,
      targetMatchRate: 0.3,
      rng: seededRng(99),
    });

    const VALID_LETTERS = new Set(['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T']);

    for (const t of seq) {
      expect(t.position).toBeGreaterThanOrEqual(0);
      expect(t.position).toBeLessThanOrEqual(8);
      expect(VALID_LETTERS.has(t.letter)).toBe(true);
    }
  });

  it('produces match rate within tolerance over 10k trials (position channel)', () => {
    const N = 2;
    const TRIALS = 10000;
    const TARGET = 0.3;
    const TOLERANCE = 0.03; // 3% tolerance at 10k trials is very wide

    const seq = generateSequence({
      n: N,
      trialsPerSet: TRIALS,
      targetMatchRate: TARGET,
      rng: seededRng(1),
    });

    const matchCount = countMatches(seq, N, 'position');
    const actualRate = matchCount / (TRIALS - N);

    expect(actualRate).toBeGreaterThan(TARGET - TOLERANCE);
    expect(actualRate).toBeLessThan(TARGET + TOLERANCE);
  });

  it('produces match rate within tolerance over 10k trials (audio channel)', () => {
    const N = 2;
    const TRIALS = 10000;
    const TARGET = 0.3;
    const TOLERANCE = 0.03;

    const seq = generateSequence({
      n: N,
      trialsPerSet: TRIALS,
      targetMatchRate: TARGET,
      rng: seededRng(1),
    });

    const matchCount = countMatches(seq, N, 'audio');
    const actualRate = matchCount / (TRIALS - N);

    expect(actualRate).toBeGreaterThan(TARGET - TOLERANCE);
    expect(actualRate).toBeLessThan(TARGET + TOLERANCE);
  });

  it('honours matchRate of 1 — all trials match after n', () => {
    const seq = generateSequence({
      n: 2,
      trialsPerSet: 10,
      targetMatchRate: 1.0,
      rng: seededRng(7),
    });

    const posMatches = countMatches(seq, 2, 'position');
    const audMatches = countMatches(seq, 2, 'audio');

    expect(posMatches).toBe(8); // trials 2-9 = 8 eligible
    expect(audMatches).toBe(8);
  });

  it('honours matchRate of 0 — no trials match after n', () => {
    const seq = generateSequence({
      n: 2,
      trialsPerSet: 10,
      targetMatchRate: 0.0,
      rng: seededRng(7),
    });

    const posMatches = countMatches(seq, 2, 'position');
    const audMatches = countMatches(seq, 2, 'audio');

    expect(posMatches).toBe(0);
    expect(audMatches).toBe(0);
  });
});

describe('isMatch', () => {
  const seq = generateSequence({
    n: 2,
    trialsPerSet: 10,
    targetMatchRate: 0,
    rng: seededRng(123),
  });

  it('returns false when i < n', () => {
    expect(isMatch(seq, 0, 2, 'position')).toBe(false);
    expect(isMatch(seq, 1, 2, 'audio')).toBe(false);
  });

  it('returns false when trial is out of bounds', () => {
    expect(isMatch(seq, 999, 2, 'position')).toBe(false);
  });
});

describe('countMatches', () => {
  it('counts position matches correctly for forced-match sequence', () => {
    // Force every trial after n to match the one n-back via identical values
    const seq = generateSequence({
      n: 3,
      trialsPerSet: 10,
      targetMatchRate: 1.0, // everything matches
      rng: seededRng(42),
    });

    const c = countMatches(seq, 3, 'position');
    expect(c).toBe(7); // trials 3-9 = 7 eligible
  });

  it('counts audio matches correctly for forced-match sequence', () => {
    const seq = generateSequence({
      n: 3,
      trialsPerSet: 10,
      targetMatchRate: 1.0,
      rng: seededRng(42),
    });

    const c = countMatches(seq, 3, 'audio');
    expect(c).toBe(7);
  });
});
