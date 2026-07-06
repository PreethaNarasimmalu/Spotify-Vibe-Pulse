# Phase-wise Architecture — Spotify Vibe Pulse

Reference companion to `docs/technical-flow.md` (full architecture) and `docs/status.md`
(running decision/test log). This file exists specifically to answer "what does each phase
touch and why" without re-reading the whole status log.

9 build phases total, matching the confirmed build order. Each phase is built, run with
`npm run dev`, and verified — including its integration points with prior phases — before the
next one starts.

## Phase 1 — Scaffold, dark shell, sidebar/topbar ✅
**Files:** `vite.config.js`, `src/index.css`, `src/components/layout/*`, `src/pages/*` (stubs),
`src/App.jsx`.
**Architecture:** Vite + React + Tailwind v4 (CSS-first, via `@tailwindcss/vite`). No routing
library — `App.jsx` holds `activeTab` state and swaps page components directly. No API calls.

## Phase 2 — Persistent bottom player ✅
**Files:** `src/context/PlayerContext.jsx`, `src/components/player/*`.
**Architecture:** One `<audio>` element rendered once inside `PlayerProvider`, referenced via
`useRef` so it survives every re-render and tab switch. Exposes `play(track, queue)`,
`togglePlay`, `seek`, `setVolume`, `skipNext`/`skipPrevious` over a lightweight queue (whatever
track list was on-screen when a card was clicked). No API calls — this phase only proved the
audio mechanics work.

## Phase 3 — Home, real iTunes tracks ✅
**Files:** `src/api/itunes.js`, `src/components/cards/TrackCard.jsx`, `src/pages/Home.jsx`.
**Architecture:** On mount, `Home.jsx` fires 3 seed queries in parallel via
`searchTracks(term, limit)` → `GET https://itunes.apple.com/search?term=...&media=music&limit=10`,
normalizes each result to `{id, trackName, artistName, artworkUrl, previewUrl}`, drops any result
missing a `previewUrl`. `TrackCard` (shared component, reused by Vibe Pulse in Phase 5) renders
each result; clicking one calls `PlayerContext.play(track, sectionTracks)` — the same shared
player from Phase 2.
**API calls:** iTunes only (no key, no billing). 3 calls on Home mount.

## Phase 4 — Taste Anchors chip-tap flow ✅
**Files:** `src/lib/storage.js`, `src/hooks/useLocalStorage.js`,
`src/components/tasteAnchors/*`, `src/App.jsx` (`AppShell`).
**Architecture:** 4-step chip wizard (3 styles → 3 artists → 2 directors/composers → 1 singer)
from static curated option lists — no API call, fully offline. Writes
`{styles, artists, directors, singer, updatedAt}` to `localStorage.tasteAnchors` on save.
`AppShell` counts real track plays via `currentTrack` from `PlayerContext` and shows a dismissible
banner once `playCount >= 3` and `tasteAnchors` is unset; Sidebar's "Update your taste" opens the
same modal on demand any time.
**API calls:** none.

## Phase 5 — Vibe Pulse tab (mood cloud → Groq → iTunes → suggestion cards) ✅
**Files:** `src/api/groq.js`, `src/components/vibePulse/MoodCloud.jsx`,
`src/components/vibePulse/SuggestionGrid.jsx`, `src/pages/VibePulse.jsx`.
Scope is the daily-cap mood-cloud path only — the manual "change my vibe" button
(`ChangeVibeButton.jsx`) and thumbs feedback are Phase 6, per the spec's own build-order split.
**Architecture:**
1. Daily-cap check reads `localStorage.dailyVibePrompt.lastShownDate`; if not today, show the
   scattered mood-word cloud (always dismissible, never blocks the rest of the app).
2. On a mood tap (daily prompt or the manual "change my vibe" button — same code path either way),
   call `getMoodRecommendations(tasteAnchors, mood)` in `groq.js`:
   ```
   POST https://api.groq.com/openai/v1/chat/completions
   Authorization: Bearer <key>
   { model: "llama-3.3-70b-versatile",
     messages: [{role:"system", content:"<recommendation-engine prompt>"}, {role:"user", content: JSON.stringify({tasteAnchors, mood})}],
     response_format: {type:"json_object"} }
   ```
   **Exactly 1 LLM call per mood tap.** Response parsed as `{"tracks":[{artist,track} x6]}`.
3. For each of the 6 `{artist, track}` pairs, call `searchByArtistTrack(artist, track)` from
   `api/itunes.js` (already built in Phase 3) via `Promise.all` — **up to 6 non-LLM iTunes calls**,
   no key needed. Results with no match are dropped.
4. `SuggestionGrid` renders the surviving tracks as `TrackCard`s (same shared component as Home),
   wired to the same `PlayerContext.play()` — this is the integration point Phase 5 explicitly
   tests: Vibe Pulse suggestions feeding the shared player.

**Multi-key rotation (added per user request, 2026-07-05):** `groq.js` reads a comma-separated
`VITE_GROQ_API_KEYS` env var (up to 5 keys). It tries the current key; on a retryable failure
(401/403/429, or a network error) it advances to the next key and retries, up to once per key.
It sticks with whichever key last succeeded for subsequent calls rather than round-robining on
every request. This is a resilience measure only — it does not change the request/response shape
above.

**API calls per mood tap:** 1 Groq (LLM) + ≤6 iTunes (non-LLM).

## Phase 6 — Thumbs up/down + manual "change my vibe" button ✅
**Files:** `src/components/vibePulse/ChangeVibeButton.jsx`, updated
`SuggestionGrid.jsx`/`TrackCard`'s `thumbs` prop, updated `VibePulse.jsx`.
**Architecture:** Thumbs write to `localStorage.vibePulseFeedback` (`{"<artistName>::<trackName>": "up"|"down"}`)
— a key isolated from `tasteAnchors`, by design: Vibe Pulse feedback must never silently alter the
user's primary taste profile. The "change my vibe" icon is always visible in the Vibe Pulse tab,
independent of the daily cap, and re-opens the mood cloud on demand (same Groq/iTunes pipeline as
Phase 5, via a separate `manualPromptOpen` state that never touches `dailyVibePrompt`). No new API
calls beyond what Phase 5 already makes.

## Phase 7 — Debug Metrics panel ❌ Reverted (2026-07-06)
Originally built a `lib/metrics.js` + `DebugMetricsPanel.jsx` recording the 5 case-study metrics
from the spec. Removed entirely per user request: this isn't a user-facing feature (real Spotify
tracks this kind of thing in an internal analytics dashboard, not the client app), and the user
wants the prototype to contain only user-specific features. All recorder calls, the `source`
tagging in `itunes.js` that existed solely to feed it, and the `vibePulseMetrics` storage key were
removed too — see `status.md` for the full list of what was taken out and how the removal was
verified.

## Phase 8 — Visual polish ✅
**Files:** `src/components/icons/PlaybackIcons.jsx`, `src/components/player/VolumeSlider.jsx`,
updated `PlayerBar.jsx`, `TrackCard.jsx`, `Home.jsx`.
No new architecture — replaced emoji-based playback controls with proper SVG icons matching
Spotify's icon language, replaced the native volume `<input type=range>` with a custom slider
matching the existing progress bar, fixed the track-card play/pause overlay to stay visible while
that track is playing (not just on hover), and added a time-of-day Home greeting. No API calls.

## Phase 9 — Deploy to Vercel (in progress)
Push to GitHub (done — this branch), import in Vercel, add `VITE_GROQ_API_KEYS` (or
`VITE_GROQ_API_KEY`) as a Vercel project environment variable, deploy. This is also where live
iTunes/Groq network calls get their first real (non-mocked) confirmation, since this sandbox's
egress policy blocks both hosts (see `docs/status.md` decision log) — and blocks `vercel.com`
itself, so the deploy is handed off to the user rather than run from this sandbox via CLI.
