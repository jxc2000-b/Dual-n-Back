# Dual N-Back

A browser-based Dual N-Back working-memory training game. TypeScript, React, Vite, vanilla CSS, no heavy dependencies.

## Stack

- **Vite + React 18 + TypeScript** (strict)
- **react-router-dom** for `/train`, `/stats`, `/settings`
- **Vanilla CSS with custom properties** for the muted/dark theme
- **Web Audio API** for low-latency letter playback (with `<audio>` fallback)
- **localStorage** today, **Supabase**-ready via a shared `StorageAdapter` interface

## Run

```bash
npm install
npm run audio:gen   # one-time: generates 8 letter clips into public/audio/
npm run dev
```

Generation needs `ffmpeg` plus one of `say` (macOS) / `espeak-ng` / `espeak`. Once produced, commit the mp3s — they're tiny (~5–10 KB each).

## Status — what's done vs. what other agents pick up

This repo is a **scaffold + non-UI implementations**. The engine, storage, audio, theme, and module contracts are complete. The UI is intentionally skeletal: the app boots, routes work, components render bare structure, but **no game logic is wired into the UI yet**. Read [`PLAN.md`](./PLAN.md) for the full per-area breakdown.

### Done

- [x] Project scaffold (Vite, TS strict, path aliases, build passes)
- [x] Theme tokens (`src/ui/theme/tokens.css`) + global reset
- [x] Engine — types, sequence generator with controlled match rate, scoring (TP/FP/TN/FN per channel), session state machine (`src/engine/`)
- [x] `useGameSession` hook driving the trial-timer loop (`src/hooks/useGameSession.ts`)
- [x] `LetterPlayer` audio class with preload + Web Audio playback + fallback (`src/audio/letterPlayer.ts`)
- [x] `StorageAdapter` interface + `LocalStorageAdapter` + `SupabaseAdapter` stub + daily rollup helper (`src/storage/`)
- [x] Router shell, App layout, page skeletons, component skeletons (Grid, HotkeyButtons, Toast, SidePanel)
- [x] `npm run audio:gen` script for the 8 letter clips

### Open — for other agents

Search the codebase for `TODO(ui-agent)` to find every site. Grouped by track:

#### Track A — Train page wiring (`src/ui/pages/TrainPage.tsx`)
- [x] Instantiate `useGameSession(config)` with config derived from current settings + selected N
- [x] On state transitions: when `stimVisible` flips true and `currentIndex` advances, call `letterPlayer.play(state.trials[state.currentIndex].letter)` once
- [x] Pass `state.trials[state.currentIndex].position` (or `null`) to `<Grid activeCell={...} />`
- [x] Wire global `keydown`: `a` → `press('position')`, `l` → `press('audio')`. Ignore on input focus.
- [x] Start/Cancel button — call `start()` / `cancel()`. Switch between teal "Start" and amber "Cancel" per screenshots.
- [x] On `state.status === 'finished'`, call `storage.appendSet(lastResult)`, refresh side-panel data, re-seed for next set
- [x] If user changes N between sets, show `<Toast message="N-Back Level Changed" />` (see `levelschanged.jpeg`)
- [x] Trial counter `"{i+1} of {trialsPerSet}"`

#### Track B — Header controls (`src/ui/layout/AppShell.tsx`) — ✅ done
- [x] Right-aligned cluster: `Type: Dual` (static), `N-Back: <select 1..9>`
- [x] Selected N is shared with the Train page via the new `useSettings()` hook + `<SettingsProvider>` (`src/hooks/useSettings.tsx`). Note: the per-session `selectedN` is intentionally decoupled from `settings.defaultN` — only the Settings page should write `defaultN` via `updateSettings`, so changing N for a single session doesn't overwrite the saved default.
- [x] Small inline-SVG title icon (two outlined squares, monochrome — uses `currentColor`)

#### Track C — Stats page (`src/ui/pages/StatsPage.tsx`) — ✅ done
- [x] Render history table from `storage.listSets()`
- [x] Per-day rollup with `storage/aggregate.rollupByDay`
- [x] SVG sparkline of avg-N-over-time and avg-accuracy-over-time (no chart deps — hand-rolled SVG)
- [x] Filter chips: today, week, month, all

#### Track D — Settings page (`src/ui/pages/SettingsPage.tsx`) — ✅ done
- [x] Form bound to `UserSettings` via `useSettings()` (writes are persisted by the provider)
- [x] Numeric inputs with clamps: `trialsPerSet (8–60)`, `trialDurationMs (1500–6000)`, `stimulusDurationMs (200–1500)`, `defaultN (1–9)`. Inputs accept free typing; clamp + persist on blur or Enter.
- [x] Volume slider 0..1 — calls `letterPlayer.setVolume(v)` live; the new value also flows through `useSettings` so it survives reloads
- [x] Toggle: `showHotkeyButtons`
- [x] Reset-to-defaults (confirm) and Clear-history (confirm). Required adding `clearSets()` to the `StorageAdapter` interface so history clears without nuking settings.

#### Track E — Visual polish
- [ ] Stim animation: 80 ms scale-in, hold for `stimulusDurationMs`, 140 ms fade-out
- [ ] Hotkey button press flash (200 ms tint)
- [ ] Toast slide-up + fade-out
- [ ] Responsive sizing of grid (clamp(360px, 60vmin, 600px))
- [ ] Focus rings consistent across header nav, buttons, selects
- [ ] Reduced-motion media query disables transitions

#### Track F — Tests (none today)
- [ ] Unit tests for `engine/sequence.ts` (match rate within tolerance over N=10k trials)
- [ ] Unit tests for `engine/scoring.ts` (every TP/FP/TN/FN bucket)
- [ ] Vitest is the suggested runner — no setup yet, free choice

#### Track G — Future Supabase
- [ ] Implement `SupabaseAdapter` (schema sketched at top of file)
- [ ] Add a `/login` route + auth provider context
- [ ] Swap the export in `src/storage/index.ts` once auth is present, keep `LocalStorageAdapter` as a guest fallback

## Layout

```
src/
  types/          # shared types (Trial, GameConfig, SetResult, UserSettings, ...)
  engine/         # pure TS — rng, sequence generator, scoring, session state machine
  hooks/          # useGameSession (drives the trial-timer loop)
  audio/          # LetterPlayer (Web Audio + fallback)
  storage/        # StorageAdapter + LocalStorageAdapter + SupabaseAdapter stub + rollups
  ui/
    theme/        # tokens.css, global.css
    layout/       # AppShell
    components/   # Grid, HotkeyButtons, Toast, SidePanel
    pages/        # TrainPage, StatsPage, SettingsPage
public/audio/     # generated letter mp3s (run `npm run audio:gen`)
scripts/          # generate-audio.sh
```

## Path aliases

`@/*` → `src/*`, `@engine/*`, `@audio/*`, `@storage/*`, `@ui/*`, `@hooks/*`, `@app-types`. Note: avoid `@types/*` — it collides with TS's npm-types resolution.

## Module boundaries (so agents can work in parallel without stepping on each other)

| Track | Owns | Imports allowed | Imports forbidden |
|-------|------|-----------------|-------------------|
| Engine | `src/engine/`, `src/types/` | `src/types` | React, DOM, anything else |
| Audio | `src/audio/` | `src/types` | React, DOM (besides Web Audio) |
| Storage | `src/storage/` | `src/types` | React, DOM (besides `localStorage`) |
| UI/Layout | `src/ui/layout/`, `App.tsx`, `main.tsx` | everything | — |
| UI/Train (Track A) | `src/ui/pages/TrainPage.tsx`, `src/ui/components/Grid.tsx`, `HotkeyButtons.tsx`, `Toast.tsx` | engine, audio, storage, hooks | — |
| UI/Stats (Track C) | `src/ui/pages/StatsPage.tsx` | storage, types | engine internals |
| UI/Settings (Track D) | `src/ui/pages/SettingsPage.tsx` | storage, audio, types | engine internals |
| Theme | `src/ui/theme/` | — | — |

If two agents both need to edit a file in this list, that's a sign the boundary needs a new helper module — extract instead of fighting over the file.
