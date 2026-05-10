import { LETTERS, type Letter, type Position, type Trial } from '@app-types';
import { defaultRng, pick, pickOther, type Rng } from './rng';

const POSITIONS: readonly Position[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

interface GenerateOpts {
  n: number;
  trialsPerSet: number;
  /** Probability that trial i (i >= n) matches trial i-n on a given channel. */
  targetMatchRate: number;
  rng?: Rng;
}

/**
 * Build a Trial sequence with controlled match probability per channel.
 * Position and audio matches are decided independently, so duals fall out at rate^2.
 */
export function generateSequence(opts: GenerateOpts): Trial[] {
  const rng = opts.rng ?? defaultRng;
  const trials: Trial[] = [];

  for (let i = 0; i < opts.trialsPerSet; i++) {
    if (i < opts.n) {
      trials.push({
        index: i,
        position: pick(POSITIONS, rng),
        letter: pick(LETTERS, rng),
      });
      continue;
    }

    const ref = trials[i - opts.n] as Trial;
    const matchPos = rng() < opts.targetMatchRate;
    const matchAud = rng() < opts.targetMatchRate;

    trials.push({
      index: i,
      position: matchPos ? ref.position : pickOther(POSITIONS, ref.position, rng),
      letter: matchAud ? ref.letter : pickOther(LETTERS, ref.letter, rng),
    });
  }

  return trials;
}

/** Whether trial i is a true match against trial i-n on the given channel. */
export function isMatch(
  trials: readonly Trial[],
  i: number,
  n: number,
  channel: 'position' | 'audio',
): boolean {
  if (i < n) return false;
  const cur = trials[i];
  const ref = trials[i - n];
  if (!cur || !ref) return false;
  return channel === 'position' ? cur.position === ref.position : cur.letter === ref.letter;
}

export function countMatches(
  trials: readonly Trial[],
  n: number,
  channel: 'position' | 'audio',
): number {
  let c = 0;
  for (let i = n; i < trials.length; i++) if (isMatch(trials, i, n, channel)) c++;
  return c;
}

/** Strings the constants used by the UI badge. */
export function letterToText(l: Letter): string { return l; }
