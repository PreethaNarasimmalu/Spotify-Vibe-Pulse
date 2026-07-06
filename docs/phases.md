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

## Phase 4 — Taste Anchors chip-tap flow ✅ (revised 2026-07-06)
**Files:** `src/lib/storage.js`, `src/hooks/useLocalStorage.js`,
`src/components/tasteAnchors/*`, `src/App.jsx` (`AppShell`).
**Architecture:** Originally a 4-step wizard (styles/artists/directors/singer); simplified per
user request to a **2-step flow**: pick 1 language → pick 3 artists from a language-matched
curated pool (`ARTISTS_BY_LANGUAGE` in `TasteAnchorsModal.jsx`, curated using live web search for
current trends rather than static memory — see `status.md`). No API call at chip-tap time, fully
offline. Writes `{language, artists, updatedAt}` to `localStorage.tasteAnchors` on save.
`AppShell` counts real track plays via `currentTrack` from `PlayerContext` and shows a dismissible
banner once `playCount >= 3` and `tasteAnchors` is unset; Sidebar's "Update your taste" opens the
same modal on demand any time.
**API calls:** none.

**Follow-up (2026-07-06):** Languages narrowed to English/Tamil/Hindi/Telugu/Malayalam + an
"Other" chip that reveals a free-text input (the one deliberate exception to "chips, not text
inputs" — no way to pre-curate arbitrary languages). Custom languages fall back to a generic
artist pool. Added a curated Malayalam pool and corrected Sai Abhyankkar's placement (Tamil, not
Telugu — he's Chennai-born and described as India's first Tamil pop star).

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

**API calls per mood tap:** 1 Groq (LLM) + ≤10 iTunes (non-LLM).

**Follow-up (2026-07-06) — recommendation-quality fix:** User reported (on the live deploy) that
picking Tamil still surfaced a Telugu-sounding track, and only 1 of 6 suggestions resolved to a
playable result. Fixed: `getMoodRecommendations` now requests 10 tracks (not 6) with system
prompts rewritten to state the taste anchors are "hard constraints, not vague hints"; `searchByArtistTrack`
now fetches `limit=5` (not 1) and prefers a result whose artist name actually matches the requested
one, and accepts a `country` param — `VibePulse.jsx` derives this from `tasteAnchors.language`
(`IN` for the four Indian languages) so regional-language searches hit the Indian iTunes storefront
instead of the thin-coverage US default. Verified via mocked Playwright tests that the right
params/prompt wording go out; actual live recommendation quality needs re-confirmation by the user
on the deployment, since this sandbox can't reach the real APIs.

## Phase 6 — Thumbs up/down + manual "change my vibe" button ✅
**Files:** `src/components/vibePulse/ChangeVibeButton.jsx`, updated
`SuggestionGrid.jsx`/`TrackCard`'s `thumbs` prop, updated `VibePulse.jsx`.
**Architecture:** Thumbs write to `localStorage.vibePulseFeedback` (`{"<artistName>::<trackName>": "up"|"down"}`)
— a key isolated from `tasteAnchors`, by design: Vibe Pulse feedback must never silently alter the
user's primary taste profile. The "change my vibe" icon is always visible in the Vibe Pulse tab,
independent of the daily cap, and re-opens the mood cloud on demand (same Groq/iTunes pipeline as
Phase 5, via a separate `manualPromptOpen` state that never touches `dailyVibePrompt`). No new API
calls beyond what Phase 5 already makes.

**Follow-up (2026-07-06):** Added `NoNewSongsButton.jsx` next to `ChangeVibeButton` — a second
persistent control that skips the mood cloud entirely and calls Groq directly in a new
`mode: 'familiar'` (vs. the default `'discovery'`), which uses an inverted system prompt asking for
well-known tracks by the user's own taste-anchor artists rather than discovery picks. Represents
the "comfort/repeat listening" side of the discovery-vs-repetition tension the case study is about.
Still exactly 1 Groq call, same iTunes resolution and `SuggestionGrid` rendering — only the prompt
and the entry point (no mood word required) differ.

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

## Follow-up — Mood picker modal + profile name (2026-07-06)
User feedback: the mood picker wasn't noticeable inline in the page, and the two Vibe Pulse buttons
weren't clear. `MoodCloud.jsx` now renders as a centered modal overlay (dark backdrop, same visual
pattern as `TasteAnchorsModal`) instead of an inline card; `ChangeVibeButton` got a visible
"Change my vibe" text label matching `NoNewSongsButton`'s existing style. Also added
`ProfileBadge.jsx` — a lightweight, non-auth display name/avatar (defaults to "Guest",
`localStorage.profileName`, click-to-edit) in the top-right of `TopBar`, mirroring where Spotify
shows the account avatar.

## Follow-up — Visual fidelity pass (2026-07-06)
**Files:** `src/components/layout/TopBar.jsx`, `src/components/layout/Sidebar.jsx`,
`src/components/layout/MainLayout.jsx`.
User shared real Spotify screenshots and said the app didn't look like Spotify. `TopBar.jsx`
rebuilt with a white circular Home button + white search pill (Enter navigates to the Search tab
stub) — Spotify's top bar has no back/forward chevrons or text title, both of which the old
`TopBar` had. `Sidebar.jsx`'s "Update your taste" panel no longer force-fills remaining sidebar
height as an empty box; it's now a compact icon+label card. Green/black branding kept as-is per
explicit instruction. Library rows, Premium upsell, and notification icons were deliberately not
added — real Spotify features never in this app's scope, and non-functional decorative buttons for
them would be dead UI.

## Follow-up — Onboarding redesign, multi-language, list view, sidebar/footer (2026-07-06)
**Files:** `src/lib/tasteData.js` (new, shared), `src/components/tasteAnchors/InlinePreferencesEditor.jsx`
(new), `src/components/vibePulse/SuggestionList.jsx` (new, replaces `SuggestionGrid.jsx`),
`src/components/layout/Footer.jsx` (new), updated `App.jsx`, `TasteAnchorsModal.jsx`,
`MoodCloud.jsx`, `Sidebar.jsx`, `MainLayout.jsx`, `groq.js`, `VibePulse.jsx`.

A large follow-up batch from two more rounds of user feedback (real Spotify screenshots + a
detailed description of a reworked onboarding/Vibe Pulse flow):
1. **Onboarding reversed**: forced first-load Taste Anchors popup (tracked via a new
   `localStorage.onboardingSeen`, separate from `tasteAnchors`, so it only ever forces once), with
   the existing contextual banner kept as a fallback if closed without finishing.
2. **Multi-language**: taste anchors now support up to 2 languages (`MAX_LANGUAGES` in the new
   `lib/tasteData.js`), with the artist step showing the deduped union of both languages' pools.
3. **Onboarding → mood picker chain**: completing the *forced* onboarding (not later
   Preferences edits) auto-navigates to Vibe Pulse and auto-opens the mood picker.
4. **Deferred mood confirmation**: tapping a mood chip only highlights it now; a floating "Set"
   button (bottom-right, above the player bar) confirms and fires the actual Groq call.
5. **List view everywhere in Vibe Pulse**: `SuggestionList` (row layout) replaces the card grid
   for all Vibe Pulse result displays — Home's card grid is untouched, this was scoped specifically
   to Vibe Pulse's individual-track recommendations.
6. **Sidebar rebuilt**: collapsible, independently-scrollable "Your Library" panel with Artists
   (reads real `tasteAnchors.artists`) and Preferences (new compact inline editor, not a reuse of
   the popup modal — the user explicitly chose a separate implementation) tabs.
7. **Footer added**: Spotify-style footer (Company/Communities/Useful links/Spotify Plans, social
   icons, legal row) on every page, matching the screenshots.

See `docs/status.md` for the three clarifying questions asked before implementing and the full
verification log (14+ checks against real mocked Groq/iTunes/DOM state, all passing).

## Follow-up — Global floating vibe button, profile privacy, sidebar chrome (2026-07-06)
**Files:** `src/components/vibePulse/FloatingVibeButton.jsx` (new), updated `App.jsx`,
`MainLayout.jsx`, `VibePulse.jsx`, `ProfileBadge.jsx`, `Sidebar.jsx`, `MoodCloud.jsx`,
`TasteAnchorsModal.jsx`.

The "Set" button from the previous batch only appeared transiently inside the mood-cloud modal —
not the persistent, always-visible floating button that was actually requested. Added
`FloatingVibeButton.jsx`, rendered once in `MainLayout` (visible on every tab), reusing the same
navigate-and-auto-open mechanism as the onboarding chain and never gated by the daily cap.
`ProfileBadge` reworked to show only a round avatar with a generic placeholder initial ("P") — no
visible name text at all, and no real personal name in the code, per explicit privacy instruction.
Sidebar gained decorative Create/Expand icons and a search+Recents row matching the reference
screenshot. Fixed a real bug found while testing: dismissing the onboarding-auto-opened mood cloud
immediately revealed a second, separate daily-prompt mood cloud stacked behind it — fixed by having
the manual picker's handlers also resolve the daily prompt state.

## Follow-up — Set button placement + real listening history (2026-07-06)
**Files:** `src/lib/listeningHistory.js` (new), updated `MoodCloud.jsx`, `PlayerContext.jsx`,
`groq.js`, `VibePulse.jsx`.

Moved the "Set" confirm button from a detached viewport-corner floating element into the mood-cloud
modal itself (rendered below the chips, confirmed a true DOM child of the dialog) — the separate
persistent "Set your vibe" global trigger button is unchanged. Re-verified (not re-built) that
first-load onboarding genuinely works from a fresh browser context — it's designed to fire once per
browser, so a session that already completed it correctly doesn't show it again. Added real
listening history: `PlayerContext.play()` records every genuinely-new track played to
`localStorage.listeningHistory` (capped, deduped); `getMoodRecommendations` now takes a
`recentlyPlayed` param included in the Groq prompt, with familiar-mode instructed to favor real
recent listening over the static onboarding list. Fixed `handleNoNewSongs` to reuse the
last-selected mood instead of a hardcoded placeholder, so "no new songs" stays relevant to the
vibe the user actually set.

## Follow-up — Preferences popup, round FAB, contextual thumbs (2026-07-06)
**Files:** deleted `InlinePreferencesEditor.jsx` and `ChangeVibeButton.jsx`; updated `Sidebar.jsx`,
`MainLayout.jsx`, `App.jsx`, `FloatingVibeButton.jsx`, `VibePulse.jsx`, `SuggestionList.jsx`.

Reversed the earlier "inline sidebar editor" decision per explicit new instruction — Sidebar's
"Preferences" pill now opens the same `TasteAnchorsModal` popup used everywhere else, instead of
switching to inline content. Consolidated the mood-picker trigger down to one control:
`FloatingVibeButton` is now a true circular FAB (bottom-right, icon-only), and the redundant
header "Change my vibe" pill (`ChangeVibeButton.jsx`) was deleted outright. `SuggestionList` only
shows thumbs feedback for the currently-loaded track, not every row up front — feedback is asked
after listening, not before.

## Follow-up — Onboarding sequence fix: delay, close-also-chains (2026-07-06)
**Files:** `App.jsx`, `TasteAnchorsModal.jsx`.

The prior "chain to vibe popup" logic only fired when the user finished and saved preferences, not
when they closed the popup without finishing — which meant the two-popup sequence broke silently
for anyone who just hit the X. Fixed `closeTasteModal()` to mirror `saveTasteAnchors()` so both
paths chain into the mood popup during the one-shot onboarding flow. Also added a 1.5s delay before
the first-load popup appears (instead of instantly on mount), and added a "Choose your favorites"
title to the modal. Verified end-to-end with Playwright: close-without-finishing still chains to
the vibe popup and a playlist displays if a mood is picked; the sequence never re-fires after the
first time.

## Follow-up — "Other" option for artists (2026-07-06)
**Files:** `lib/tasteData.js`, `TasteAnchorsModal.jsx`.

Artists step now has the same "Other" escape hatch the language step already had: an "Other" chip
alongside the curated pool that, when picked, reveals a text box to type a custom artist name. The
typed name (not the literal word "Other") is what gets saved and counted toward the 3-artist
minimum, and re-opening the modal later correctly restores a previously typed custom artist.

## Phase 9 — Deploy to Vercel (in progress)
Push to GitHub (done — this branch), import in Vercel, add `VITE_GROQ_API_KEYS` (or
`VITE_GROQ_API_KEY`) as a Vercel project environment variable, deploy. This is also where live
iTunes/Groq network calls get their first real (non-mocked) confirmation, since this sandbox's
egress policy blocks both hosts (see `docs/status.md` decision log) — and blocks `vercel.com`
itself, so the deploy is handed off to the user rather than run from this sandbox via CLI.
