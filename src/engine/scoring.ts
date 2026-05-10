import type {
  ChannelScore,
  ScoreBreakdown,
  Trial,
  UserResponse,
} from '@app-types';
import { isMatch } from './sequence';

function emptyBreakdown(): ScoreBreakdown {
  return { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0, accuracy: 1 };
}

function finalize(b: ScoreBreakdown): ScoreBreakdown {
  const total = b.truePositive + b.falsePositive + b.trueNegative + b.falseNegative;
  return { ...b, accuracy: total === 0 ? 1 : (b.truePositive + b.trueNegative) / total };
}

/**
 * Compute per-channel TP/FP/TN/FN over trials. The first n trials cannot be
 * matches by construction and are excluded from the denominator.
 */
export function scoreSet(
  trials: readonly Trial[],
  responses: readonly UserResponse[],
  n: number,
): ChannelScore {
  const pos = emptyBreakdown();
  const aud = emptyBreakdown();

  for (let i = n; i < trials.length; i++) {
    const r = responses[i] ?? { position: false, audio: false };
    const pm = isMatch(trials, i, n, 'position');
    const am = isMatch(trials, i, n, 'audio');

    if (pm && r.position) pos.truePositive++;
    else if (pm && !r.position) pos.falseNegative++;
    else if (!pm && r.position) pos.falsePositive++;
    else pos.trueNegative++;

    if (am && r.audio) aud.truePositive++;
    else if (am && !r.audio) aud.falseNegative++;
    else if (!am && r.audio) aud.falsePositive++;
    else aud.trueNegative++;
  }

  const position = finalize(pos);
  const audio = finalize(aud);
  return {
    position,
    audio,
    combinedAccuracy: (position.accuracy + audio.accuracy) / 2,
  };
}
