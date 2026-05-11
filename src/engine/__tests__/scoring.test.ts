import { describe, it, expect } from 'vitest';
import { scoreSet } from '../scoring';
import type { Trial, UserResponse } from '@app-types';

/** Helper: build a raw trial object. Only position + letter matter for scoring. */
function t(
  index: number,
  position: Trial['position'],
  letter: Trial['letter'],
): Trial {
  return { index, position, letter };
}

/** Helper: build a raw response. */
function r(position: boolean, audio: boolean): UserResponse {
  return { position, audio };
}

describe('scoreSet', () => {
  it('returns empty breakdowns (accuracy = 1) when no trials beyond n exist', () => {
    const trials = [t(0, 0, 'C'), t(1, 1, 'H'), t(2, 2, 'K')];
    const responses: UserResponse[] = [];
    const result = scoreSet(trials, responses, 3);

    expect(result.position.accuracy).toBe(1);
    expect(result.audio.accuracy).toBe(1);
    expect(result.position.truePositive).toBe(0);
    expect(result.position.falsePositive).toBe(0);
    expect(result.position.trueNegative).toBe(0);
    expect(result.position.falseNegative).toBe(0);
  });

  it('counts a true positive correctly (position)', () => {
    // N=2: trial 0 pos=3, trial 2 pos=3 → match; user presses position
    const trials = [
      t(0, 3, 'A'), // dummy letter, not an allowed one but fine for pos test
      t(1, 7, 'B'),
      t(2, 3, 'C'), // matches trial 0 position!
    ];
    const responses = [
      r(false, false), // trial 0 (ignored, i < n)
      r(false, false), // trial 1 (ignored, i < n)
      r(true, false),  // trial 2: pressed position
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.position.truePositive).toBe(1);
    expect(result.position.falsePositive).toBe(0);
    expect(result.position.falseNegative).toBe(0);
    expect(result.position.trueNegative).toBe(0);
    expect(result.position.accuracy).toBe(1);
  });

  it('counts a false negative correctly (position)', () => {
    // N=2: trial 2 matches trial 0, user does NOT press
    const trials = [
      t(0, 3, 'A'),
      t(1, 7, 'B'),
      t(2, 3, 'C'), // match on position
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(false, false), // did NOT press position
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.position.truePositive).toBe(0);
    expect(result.position.falseNegative).toBe(1);
    expect(result.position.falsePositive).toBe(0);
    expect(result.position.trueNegative).toBe(0);
    expect(result.position.accuracy).toBe(0);
  });

  it('counts a false positive correctly (position)', () => {
    // N=2: trial 2 does NOT match trial 0, user presses
    const trials = [
      t(0, 3, 'A'),
      t(1, 7, 'B'),
      t(2, 5, 'C'), // different position!
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(true, false), // pressed position incorrectly
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.position.truePositive).toBe(0);
    expect(result.position.falseNegative).toBe(0);
    expect(result.position.falsePositive).toBe(1);
    expect(result.position.trueNegative).toBe(0);
    expect(result.position.accuracy).toBe(0);
  });

  it('counts a true negative correctly (position)', () => {
    // N=2: trial 2 does NOT match trial 0, user does NOT press
    const trials = [
      t(0, 3, 'A'),
      t(1, 7, 'B'),
      t(2, 5, 'C'), // different position
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(false, false), // correctly did NOT press
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.position.truePositive).toBe(0);
    expect(result.position.falseNegative).toBe(0);
    expect(result.position.falsePositive).toBe(0);
    expect(result.position.trueNegative).toBe(1);
    expect(result.position.accuracy).toBe(1);
  });

  // --- Same for audio channel ---

  it('counts a true positive correctly (audio)', () => {
    const trials = [
      t(0, 0, 'C'),
      t(1, 1, 'H'),
      t(2, 2, 'C'), // matches trial 0 letter!
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(false, true), // pressed audio
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.audio.truePositive).toBe(1);
    expect(result.audio.falsePositive).toBe(0);
    expect(result.audio.falseNegative).toBe(0);
    expect(result.audio.trueNegative).toBe(0);
    expect(result.audio.accuracy).toBe(1);
  });

  it('counts a false negative correctly (audio)', () => {
    const trials = [
      t(0, 0, 'C'),
      t(1, 1, 'H'),
      t(2, 2, 'C'), // matches letter
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(false, false), // did NOT press audio
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.audio.falseNegative).toBe(1);
    expect(result.audio.truePositive).toBe(0);
    expect(result.audio.accuracy).toBe(0);
  });

  it('counts a false positive correctly (audio)', () => {
    const trials = [
      t(0, 0, 'C'),
      t(1, 1, 'H'),
      t(2, 2, 'K'), // different letter
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(false, true), // incorrectly pressed audio
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.audio.falsePositive).toBe(1);
    expect(result.audio.truePositive).toBe(0);
    expect(result.audio.accuracy).toBe(0);
  });

  it('counts a true negative correctly (audio)', () => {
    const trials = [
      t(0, 0, 'C'),
      t(1, 1, 'H'),
      t(2, 2, 'K'), // different letter
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(false, false), // correctly did NOT press
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.audio.trueNegative).toBe(1);
    expect(result.audio.falsePositive).toBe(0);
    expect(result.audio.accuracy).toBe(1);
  });

  // --- Dual matches ---

  it('handles dual n-back: both channels matching simultaneously', () => {
    const trials = [
      t(0, 3, 'C'),
      t(1, 7, 'H'),
      t(2, 3, 'C'), // matches BOTH position and letter of trial 0!
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(true, true), // pressed both
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.position.truePositive).toBe(1);
    expect(result.audio.truePositive).toBe(1);
    expect(result.combinedAccuracy).toBe(1);
  });

  it('handles dual n-back: one channel hit, one miss', () => {
    const trials = [
      t(0, 3, 'C'),
      t(1, 7, 'H'),
      t(2, 3, 'C'), // matches BOTH
    ];
    const responses = [
      r(false, false),
      r(false, false),
      r(true, false), // only pressed position, missed audio
    ];
    const result = scoreSet(trials, responses, 2);

    expect(result.position.truePositive).toBe(1);
    expect(result.audio.falseNegative).toBe(1);
    expect(result.position.accuracy).toBe(1);
    expect(result.audio.accuracy).toBe(0);
    expect(result.combinedAccuracy).toBe(0.5);
  });

  // --- Mixed / aggregate ---

  it('computes correct accuracy over a mixed set', () => {
    // 5 eligible trials (i = 2..6), N=2
    // Trial 2: pos match, aud no match — user presses pos only
    // Trial 3: pos no match, aud match — user presses both (wrong pos, right aud)
    // Trial 4: pos match, aud match — user presses both (right pos, right aud)
    // Trial 5: pos no match, aud no match — user presses neither (both right)
    // Trial 6: pos match, aud no match — user presses neither (missed pos, right aud)
    const trials = [
      t(0, 3, 'C'),
      t(1, 7, 'H'),
      t(2, 3, 'K'), // pos=3 matches trial 0, aud=K different from C → pos match, aud no match
      t(3, 5, 'H'), // pos=5 ≠ 7(trial 1), aud=H matches trial 1=H → pos no match, aud match
      t(4, 3, 'K'), // pos=3 matches trial 2=3, aud=K matches trial 2=K → dual match
      t(5, 8, 'Q'), // pos=8 ≠ 5(trial 3), aud=Q ≠ H(trial 3) → no match
      t(6, 3, 'S'), // pos=3 matches trial 4=3, aud=S ≠ K(trial 4) → pos match, aud no match
    ];
    const responses = [
      r(false, false), // trial 0 (i < n)
      r(false, false), // trial 1 (i < n)
      r(true, false),  // trial 2: pos TP, aud TN
      r(true, true),   // trial 3: pos FP, aud TP
      r(true, true),   // trial 4: pos TP, aud TP
      r(false, false), // trial 5: pos TN, aud TN
      r(false, false), // trial 6: pos FN, aud TN
    ];
    const result = scoreSet(trials, responses, 2);

    // Position: TP=2 (t2,t4), FP=1 (t3), TN=1 (t5), FN=1 (t6) → acc = 3/5 = 0.6
    expect(result.position.truePositive).toBe(2);
    expect(result.position.falsePositive).toBe(1);
    expect(result.position.trueNegative).toBe(1);
    expect(result.position.falseNegative).toBe(1);
    expect(result.position.accuracy).toBeCloseTo(0.6, 5);

    // Audio: TP=2 (t3,t4), FP=0, TN=3 (t2,t5,t6), FN=0 → acc = 5/5 = 1
    expect(result.audio.truePositive).toBe(2);
    expect(result.audio.falsePositive).toBe(0);
    expect(result.audio.trueNegative).toBe(3);
    expect(result.audio.falseNegative).toBe(0);
    expect(result.audio.accuracy).toBeCloseTo(1, 5);

    // combined = (0.6 + 1) / 2 = 0.8
    expect(result.combinedAccuracy).toBeCloseTo(0.8, 5);
  });

  // --- Edge cases ---

  it('handles no responses (default false for every trial)', () => {
    const trials = [
      t(0, 0, 'C'),
      t(1, 1, 'H'),
      t(2, 0, 'K'), // pos match, aud no match
    ];
    const responses: UserResponse[] = []; // empty → defaults to false/false
    const result = scoreSet(trials, responses, 2);

    // No response → pos false negative, audio true negative
    expect(result.position.falseNegative).toBe(1);
    expect(result.audio.trueNegative).toBe(1);
  });

  it('handles n=1 correctly', () => {
    // With n=1, every trial after index 0 is checked against the previous trial
    const trials = [
      t(0, 3, 'C'),
      t(1, 3, 'C'), // both match trial 0
      t(2, 4, 'H'), // neither matches trial 1
    ];
    const responses = [
      r(false, false),
      r(true, true),  // trial 1: dual TP
      r(false, false), // trial 2: dual TN
    ];
    const result = scoreSet(trials, responses, 1);

    expect(result.position.truePositive).toBe(1);
    expect(result.position.trueNegative).toBe(1);
    expect(result.audio.truePositive).toBe(1);
    expect(result.audio.trueNegative).toBe(1);
    expect(result.combinedAccuracy).toBe(1);
  });
});
