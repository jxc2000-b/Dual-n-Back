import type { Letter } from '@app-types';
import { LETTERS } from '@app-types';

/**
 * Plays pre-decoded letter clips through Web Audio for low-latency,
 * jitter-free stim. Falls back to <audio> element if decode fails.
 */
export class LetterPlayer {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffers = new Map<Letter, AudioBuffer>();
  private fallback = new Map<Letter, HTMLAudioElement>();
  private volume = 0.8;
  private ready: Promise<void> | null = null;

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.gain) this.gain.gain.value = this.volume;
    for (const a of this.fallback.values()) a.volume = this.volume;
  }

  /** Lazily build the AudioContext on first user gesture. */
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Preload all letters. Idempotent — safe to call repeatedly. */
  async preload(basePath = '/audio'): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      const ctx = this.ensureCtx();
      await Promise.all(
        LETTERS.map(async (letter) => {
          const url = `${basePath}/${letter.toLowerCase()}.mp3`;
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
            const arr = await res.arrayBuffer();
            const buf = await ctx.decodeAudioData(arr);
            this.buffers.set(letter, buf);
          } catch (err) {
            // Fall back to <audio> element so the game still works without files.
            const el = new Audio(url);
            el.preload = 'auto';
            el.volume = this.volume;
            this.fallback.set(letter, el);
            // eslint-disable-next-line no-console
            console.warn(`[audio] decode failed for ${letter}, using <audio> fallback`, err);
          }
        }),
      );
    })();
    return this.ready;
  }

  /** Resume the context after a user gesture (browsers gate autoplay). */
  async resume(): Promise<void> {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
  }

  play(letter: Letter): void {
    const buf = this.buffers.get(letter);
    if (buf && this.ctx && this.gain) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.gain);
      src.start(0);
      return;
    }
    const el = this.fallback.get(letter);
    if (el) {
      el.currentTime = 0;
      void el.play().catch(() => {});
    }
  }
}

export const letterPlayer = new LetterPlayer();
