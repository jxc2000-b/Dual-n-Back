// Deterministic-friendly RNG so tests can pin sequences. Defaults to Math.random.

export type Rng = () => number;

export const defaultRng: Rng = Math.random;

export function pick<T>(arr: readonly T[], rng: Rng = defaultRng): T {
  // Internal callers pass non-empty arrays; cast keeps strict noUncheckedIndexedAccess happy.
  return arr[Math.floor(rng() * arr.length)] as T;
}

export function pickOther<T>(arr: readonly T[], exclude: T, rng: Rng = defaultRng): T {
  if (arr.length < 2) return exclude;
  let v: T;
  do { v = pick(arr, rng); } while (v === exclude);
  return v;
}
