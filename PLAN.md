# Implementation Plan

This document is the source of truth for parallel agent work. Each section names an agent track, the files it owns, the contracts it must respect, the open todos, and the acceptance criteria.

> The README has the executive summary. This file goes deeper. If something contradicts the README, fix the README.

## Architectural principles

1. **Engine is pure.** No React, no DOM, no `Date.now()` outside the session module. Deterministic given a seeded RNG.
2. **Storage is an interface.** UI calls `StorageAdapter` methods only. Today the export is `LocalStorageAdapter`; tomorrow it's `SupabaseAdapter`. UI must not change.
3. **Audio is decoupled.** `LetterPlayer` knows nothing about trials. The Train page calls `play(letter)` at the right moment.
4. **Theme is tokens.** No hard-coded hex in components. Read from `src/ui/theme/tokens.css`.
5. **No heavy deps.** If a tracker is tempted to add a chart library, build the SVG by hand instead. Snappiness is a feature.

## Reference images

- `prompts/images/levelschanged.jpeg` — header layout, level-changed toast
- `prompts/images/gridhighlighted.jpeg` / `gridhighlighted2.jpeg` — active stim cell color, padding inside cell, hotkey buttons
- `prompts/images/postsetstatistics.jpeg` — right-side panel layout (Next Set, Today's Sets, Today's Statistics)

---

## 1. Engine (`src/engine/`, `src/types/`)

**Status:** ✅ Implemented. No work pending unless behavior changes.

**Files:**
- `src/types/index.ts` — `Trial`, `UserResponse`, `GameConfig`, `SetResult`, `ChannelScore`, `ScoreBreakdown`, `UserSettings`, `LETTERS`, `DEFAULT_SETTINGS`
- `src/engine/rng.ts` — `Rng`, `pick`, `pickOther`
- `src/engine/sequence.ts` — `generateSequence`, `isMatch`, `countMatches`
- `src/engine/scoring.ts` — `scoreSet`
- `src/engine/session.ts` — `SessionState`, `applyResponse`, `initSession`

**Contracts:**
- `generateSequence({ n, trialsPerSet, targetMatchRate, rng? })` returns `Trial[]` of length `trialsPerSet`. The first `n` trials cannot be matches. For `i ≥ n`, position and audio matches are independent Bernoulli(targetMatchRate).
- `scoreSet(trials, responses, n)` ignores trials `[0, n)` (cannot be matches). Returns per-channel TP/FP/TN/FN + accuracy + `combinedAccuracy = (pos + aud) / 2`.
- `applyResponse` is idempotent within a trial — pressing A twice still records `position: true` exactly once.

**Acceptance:**
- Over 10k generated trials with `targetMatchRate=0.3`, the realized rate per channel must be within ±0.02.
- `scoreSet` with all-true and all-false responses sweeps every bucket.

---

## 2. Audio (`src/audio/`)

**Status:** ✅ Implemented. Pending: generated mp3 files (commit them).

**Files:**
- `src/audio/letterPlayer.ts` — `LetterPlayer` class + singleton `letterPlayer`

**Contracts:**
- `letterPlayer.preload(basePath?)` — idempotent, returns same Promise on re-entry.
- `letterPlayer.play(letter)` is fire-and-forget; never throws. If neither buffer nor fallback exists, it silently no-ops.
- `letterPlayer.setVolume(0..1)` is clamped.
- The first call to `play()` will fail silently in browsers if the AudioContext was never resumed. Train page MUST call `letterPlayer.resume()` from the Start button click handler.

**Open:**
- [ ] Run `npm run audio:gen` and commit `public/audio/{c,h,k,l,q,r,s,t}.mp3`.
- [ ] Decide whether to bundle the clips into the JS via base64 (probably no — keep them as cacheable assets).

**Acceptance:**
- Hitting Start causes the first letter to play within < 50 ms of trial-1 stim onset on a warm session.

---

## 3. Storage (`src/storage/`)

**Status:** ✅ Local adapter implemented. Supabase stub waiting on accounts work.

**Files:**
- `src/storage/adapter.ts` — `StorageAdapter` interface, `DailyRollup`
- `src/storage/localAdapter.ts` — `LocalStorageAdapter`
- `src/storage/supabaseAdapter.ts` — `SupabaseAdapter` (stub)
- `src/storage/aggregate.ts` — `rollupByDay`, `startOfTodayMs`
- `src/storage/index.ts` — exports the active adapter (`storage`)

**Contracts:**
- `appendSet` must be O(1) amortized — local impl reads/writes the whole array but that's fine until ~10 k sets; revisit if we hit that.
- `listSets({ sinceMs, limit })` filters by start time and tail-limits.
- All methods are async to keep the Supabase swap source-compatible.

**Storage keys (versioned):**
- `dnb.settings.v1` → `UserSettings`
- `dnb.sets.v1` → `SetResult[]`

**Open (Track G — Future):**
- [ ] Implement `SupabaseAdapter` against a single `sets` table + `user_settings` keyed by `auth.uid()`.
- [ ] Add a small migration helper that copies `dnb.sets.v1` from localStorage into Supabase on first sign-in.

**Acceptance:**
- `npm run typecheck` is green with `LocalStorageAdapter` exported and again with `SupabaseAdapter` exported (once implemented).

---

## 4. Theme (`src/ui/theme/`)

**Status:** ✅ Tokens + global reset implemented. Polish ongoing.

**Files:**
- `src/ui/theme/tokens.css` — colors, spacing, radii, type, motion, layout
- `src/ui/theme/global.css` — reset, base typography, focus rings

**Contract:** No component file may contain a literal hex color. Always reference a token. Add a token if one is missing.

**Open (Track E — Polish):** ✅ done in Track E (see Changelog).

---

## 5. UI / Layout (`src/ui/layout/`, `src/main.tsx`, `src/App.tsx`)

**Status:** Skeleton works; routing and shell render. Header controls TODO.

**Files:**
- `src/main.tsx` — bootstrap + `<BrowserRouter>`
- `src/App.tsx` — route table
- `src/ui/layout/AppShell.tsx`, `AppShell.css`

**Open (Track B — Header):**
- [ ] Add right-aligned cluster: `Type: Dual` (label, teal value), `N-Back: <select 1..9>`
- [ ] Selected N is read from settings on mount, written on change. Use a small `useSettings()` hook (to be added) that wraps `storage.loadSettings/saveSettings`.
- [ ] Title icon — small monochrome SVG; the screenshot shows two outlined squares. Inline SVG only, no asset file.
- [ ] Active route in the nav uses `--bg-sunken` background (already wired via `.active` class).

**Acceptance:**
- N selector value survives a full page reload.
- Train page reads the selected N when computing `GameConfig`.

---

## 6. UI / Train page (Track A) (`src/ui/pages/TrainPage.tsx` + Grid, HotkeyButtons, Toast)

**Status:** Skeleton renders. **No game logic wired.** Highest-priority track.

**Files:**
- `src/ui/pages/TrainPage.tsx`, `TrainPage.css`
- `src/ui/components/Grid.tsx`, `Grid.css`
- `src/ui/components/HotkeyButtons.tsx`, `HotkeyButtons.css`
- `src/ui/components/Toast.tsx`, `Toast.css`

**Wiring contract (do these in order):**

1. **Build `GameConfig`** from settings + selected N:
    ```ts
    const config: GameConfig = {
      n: selectedN,
      trialsPerSet: settings.trialsPerSet,
      trialDurationMs: settings.trialDurationMs,
      stimulusDurationMs: settings.stimulusDurationMs,
      targetMatchRate: 0.3,
    };
    ```
2. **Hook into the session:** `const { state, start, cancel, press, lastResult } = useGameSession(config);`
3. **Audio gating:** keep a ref to the previously played `currentIndex`. When `state.stimVisible === true && state.currentIndex !== prevIdx`, call `letterPlayer.play(state.trials[state.currentIndex].letter)` and update the ref. (Avoids replaying on responses.)
4. **Grid:** pass `state.stimVisible ? state.trials[state.currentIndex].position : null` as `activeCell`.
5. **Counter:** `Math.max(0, state.currentIndex + 1)` of `state.trials.length`.
6. **Start/Cancel button:**
    - On Start: call `letterPlayer.resume()` then `letterPlayer.preload()` then `start()`. Button text becomes "Cancel" while running.
    - On Cancel: `cancel()`.
7. **Hotkeys:** `useEffect` registers `window.addEventListener('keydown', ...)`; map `a`/`A` → `press('position')`, `l`/`L` → `press('audio')`. Skip if `event.target` is an input/select. Also pass an "active flash" boolean to `HotkeyButtons` for 180 ms after each press.
8. **Finish handler:** `useEffect` watches `state.status === 'finished'`. Calls `storage.appendSet(lastResult)`. Bumps a counter to refresh the side panel. Optionally re-seeds the session by changing config identity.
9. **N-changed toast:** when the user changes N in the header, show `<Toast message="N-Back Level Changed" />` for 2.2s.
10. **Side panel data:** call `storage.listSets({ sinceMs: startOfTodayMs() })`, transform into `SidePanelProps`, pass in.

**Don't:**
- Don't mutate `state.responses` directly; always go through `press()`.
- Don't run `start()` without resuming the AudioContext first — Chrome will swallow the first audio.

**Acceptance:**
- Pressing Start runs a full set: each trial highlights a cell, plays a letter, accepts A/L hotkeys, advances on `trialDurationMs`, finishes after `trialsPerSet`, and writes to localStorage.
- Reload the page after a set: side panel shows the row in "Today's Sets".

---

## 7. UI / Stats page (Track C) (`src/ui/pages/StatsPage.tsx`)

**Status:** Stub.

**Open:**
- [ ] Top filter chips: Today / 7d / 30d / All. Drives `storage.listSets({ sinceMs })`.
- [ ] Table columns: Date, Type ("D2B"), N, Accuracy %, Trials, Duration.
- [ ] Per-day rollup section (call `rollupByDay`): max N, avg N, avg accuracy, total set count, total minutes.
- [ ] Hand-rolled SVG sparkline (~80×24) for avg N over the filtered window. One stroke, accent-teal, no fill.

**Acceptance:**
- Empty state: "No sets recorded yet — go train."
- Switching filters does not refetch storage if the data is already in memory (debounce or memo).

---

## 8. UI / Settings page (Track D) (`src/ui/pages/SettingsPage.tsx`)

**Status:** Stub.

**Open:**
- [ ] `useSettings()` hook (write once, share across pages): wraps `storage.loadSettings/saveSettings` with React state.
- [ ] Inputs (all clamped on blur):
    - `defaultN` (1–9)
    - `trialsPerSet` (8–60)
    - `trialDurationMs` (1500–6000, step 100)
    - `stimulusDurationMs` (200–1500, step 50)
    - `audioVolume` (slider 0..1, step 0.05) — also calls `letterPlayer.setVolume(v)` on change
    - `showHotkeyButtons` toggle
- [ ] "Reset to defaults" — confirm + write `DEFAULT_SETTINGS`.
- [ ] "Clear all history" — confirm + `storage.clearAll()`.

**Acceptance:**
- Changing volume mid-set takes effect on the next letter.
- Form values persist across reloads.

---

## 9. Tests (Track F)

**Status:** None.

**Suggested setup:**
```bash
npm i -D vitest @vitest/ui
```
Add `"test": "vitest"` to `package.json`. Tests live next to source as `*.test.ts`.

**First targets:**
- `src/engine/sequence.test.ts` — match rate, dual-match probability, edge cases (`n >= trialsPerSet`).
- `src/engine/scoring.test.ts` — exhaustive bucket coverage, accuracy formula.
- `src/storage/aggregate.test.ts` — `rollupByDay` boundary at midnight.

---

## 10. Future — Supabase (Track G)

**Status:** Stub.

**Schema sketch:**
```sql
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.sets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  config jsonb not null,
  trials jsonb not null,
  responses jsonb not null,
  score jsonb not null
);
create index sets_user_started_idx on public.sets (user_id, started_at desc);

-- RLS: row owner sees only their rows
alter table public.user_settings enable row level security;
alter table public.sets enable row level security;
create policy "self_settings" on public.user_settings for all using (auth.uid() = user_id);
create policy "self_sets" on public.sets for all using (auth.uid() = user_id);
```

**Open:**
- [ ] Implement `SupabaseAdapter` with `@supabase/supabase-js`.
- [ ] `/login` route, simple email magic-link.
- [ ] One-shot migration: on first sign-in, copy localStorage sets into Supabase and clear local.
- [ ] Decide guest mode: if not signed in, keep using `LocalStorageAdapter`.

---

## Quick agent kickoff checklist

For a new agent picking up this repo:

1. `npm install`
2. `npm run audio:gen` (or grab the mp3s from the latest commit)
3. `npm run dev` — confirm the empty grid renders at `/train`
4. `npm run typecheck` — must be green before you start
5. Pick a track from this doc. Stick to the file ownership table in the README. If your track needs a new shared helper, add it to `src/types/` or a new `src/shared/` folder rather than reaching across boundaries.
6. When done, append a note to the bottom of this file under "Changelog" — one line, what landed.

## Changelog

- 2026-05-10 — Initial scaffold + engine/audio/storage implementations + UI skeletons.
- 2026-05-10 — Track B landed (header N selector + Type: Dual + title icon). Added `SettingsProvider` / `useSettings()` in `src/hooks/useSettings.tsx`; TrainPage now consumes the shared hook. Settings page (Track D) should also use `useSettings().updateSettings` rather than calling `storage.saveSettings` directly.
- 2026-05-10 — Track D landed (Settings page). Form bound to `useSettings()`, numeric inputs clamp on blur, live volume slider, hotkey-buttons toggle, danger-zone Reset/Clear. Added `clearSets()` to `StorageAdapter` so history clears without removing settings; `SupabaseAdapter` got the matching stub.
- 2026-05-10 — Track C landed (Stats page). History table, daily rollups via `rollupByDay`, hand-rolled SVG sparklines for avg N + avg accuracy, today/7d/30d/all filter chips. New `StatsPage.css`.
- 2026-05-10 — Track E landed (visual polish). Added `--shadow-stim` / `--bg-button-amber` tokens, `prefers-reduced-motion` query, anchor focus-visible rule. Grid stim now scale-in/fade-out via persistent `::after`; responsive `clamp(320px, 60vmin, 600px)`. HotkeyButtons get smooth tint transition. Toast plays slide-up entry + fade-out exit (internal leaving state).
