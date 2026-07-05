# Status Log — Spotify Vibe Pulse

Living log. Updated after every meaningful decision and after each build phase completes.
See `docs/technical-flow.md` for the full architecture.

## Decisions

| Date | Decision |
|------|----------|
| 2026-07-05 | Architecture proposed and confirmed by user before any code was written. |
| 2026-07-05 | Docs folder added: `technical-flow.md` (architecture) + `status.md` (this file, running log). |
| 2026-07-05 | Groq API key will be supplied by user via `.env` / secrets — not hardcoded, not committed. |
| 2026-07-05 | Tailwind v4 installed via `@tailwindcss/vite` plugin (CSS-first config, no `tailwind.config.js` content globs needed). |
| 2026-07-05 | React Context used only for the audio player (single cross-cutting state); everything else is local state + localStorage. |
| 2026-07-05 | Playwright added as a devDependency to take verification screenshots of `npm run dev` output during each phase (not used at runtime, not part of the shipped bundle). |
| 2026-07-05 | Sidebar icons hand-drawn as inline SVG (no icon library dependency) to keep the bundle lean and match Spotify's nav glyphs closely enough for the prototype. |
| 2026-07-05 | Search and Library pages are minimal stubs — spec's build order never calls for building them out, only for having the nav items present. |
| 2026-07-05 | Discovered this sandbox's egress policy blocks `itunes.apple.com` and `api.groq.com` entirely (confirmed via curl and a real headless-browser navigation, both 403 at the proxy). User chose: build real API code, verify UI/plumbing in-sandbox with local mocks/fixtures, do one real live check after Vercel deploy or on the user's own machine. This does not affect the deployed app — Vercel has normal internet access. |
| 2026-07-05 | Phase 2 hardcoded-preview verification used a locally generated WAV tone (`public/test-tone.wav`, via `scripts/gen-test-tone.mjs`) instead of a real iTunes previewUrl, since itunes.apple.com is unreachable from this sandbox. This still genuinely exercises the `<audio>` element mechanics (play/pause/seek/volume/queue). The temporary "Play test tone" button on Home will be removed in Phase 3 when real track cards replace it. |
| 2026-07-05 | PlayerContext implements a lightweight queue (`play(track, queue)`, `skipNext`/`skipPrevious`) so the spec's "skip" control in the player bar is meaningful — the queue is whatever track list was visible when a card was clicked, not a separate feature area. |
| 2026-07-05 | Phase 3 in-sandbox verification used Playwright network-route interception to stand in for the itunes.apple.com response (mocked JSON in the real API shape, `previewUrl` pointed at the local test tone). This exercises the app's actual `fetch`/parse/render code path in `api/itunes.js` and `Home.jsx` — only the transport is mocked, not the app logic. Real live iTunes calls need a normal-internet environment (Vercel or the user's machine) to confirm. |
| 2026-07-05 | Contextual taste banner trigger uses a simple in-memory play counter in `AppShell` (not persisted) — threshold of 3 plays. Dismissal is session-only (component state); production would persist `tasteBannerDismissedAt` and re-trigger on a rolling ~90-day basis or engagement milestone, noted in a code comment in `App.jsx` rather than implemented, since there's no real multi-session backend here to measure engagement against. |
| 2026-07-05 | Chip option lists (styles, artists, directors, singer) are static curated arrays hardcoded in `TasteAnchorsModal.jsx` — no API call needed for onboarding chips, keeping this phase fully offline-testable. |

## Phase status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Architecture proposal | ✅ Confirmed by user |
| 0.5 | Docs folder (technical-flow.md, status.md) | ✅ Done |
| 1 | Scaffold Vite+React+Tailwind, dark shell, sidebar/topbar | ✅ Done — verified in browser |
| 2 | Persistent bottom player (hardcoded preview) | ✅ Done — verified in browser |
| 3 | Home page, real iTunes tracks | ✅ Done — verified with mocked network transport |
| 4 | Taste Anchors chip-tap flow | ✅ Done — verified in browser |
| 5 | Vibe Pulse tab (mood cloud → Groq → iTunes → cards) | ⬜ Not started |
| 6 | Thumbs up/down + change-my-vibe button | ⬜ Not started |
| 7 | Debug Metrics panel | ⬜ Not started |
| 8 | Visual polish | ⬜ Not started |
| 9 | Deploy to Vercel | ⬜ Not started |

## Test log

### Phase 1 — Scaffold, dark shell, sidebar/topbar (2026-07-05)

**What was built:** Vite + React scaffold cleaned of boilerplate; Tailwind v4 wired in via
`@tailwindcss/vite`; dark theme base CSS (`#121212` background, Spotify green accents);
`Sidebar` (Spotify wordmark/logo, Home/Search/Your Library/Vibe Pulse nav, "Update your taste"
entry point), `TopBar` (back/forward, page title, Debug Metrics toggle button — wired to no-ops
for now), `MainLayout` (sidebar + topbar + scrollable content area), `App.jsx` as tab switcher,
stub pages for Home/Search/Library/VibePulse.

**How it was tested:** Ran `npm run dev`, curled `http://localhost:5173/` for a 200, then used
Playwright (headless Chromium) to screenshot the rendered page at 1440x900. Verified visually:
dark theme renders correctly, Spotify wordmark/logo shows in the sidebar, all 4 nav items render
with icons, active-tab highlighting works (Home active by default, white text + icon), clicking
"Vibe Pulse" in the sidebar switches the active tab — top bar title updates to "Vibe Pulse", page
content swaps to the VibePulse stub, and the nav highlight/icon color moves to Vibe Pulse (green
pulse icon). Dev server stopped after verification.

**Result:** ✅ Working as expected. Ready for Phase 2 (persistent bottom player).

### Phase 2 — Persistent bottom player (2026-07-05)

**What was built:** `PlayerContext` (single shared `<audio>` ref, `play(track, queue)`,
`togglePlay`, `seek`, `setVolume`, `skipNext`/`skipPrevious` over a lightweight queue,
`timeupdate`/`loadedmetadata`/`ended` listeners feeding `progress`/`duration`/`isPlaying` state);
`PlayerBar` (artwork, track/artist, prev/play-pause/next, `ProgressBar` with click-to-seek,
volume slider) rendered persistently in `MainLayout` below the sidebar+content row so it survives
tab switches. Since this sandbox cannot reach itunes.apple.com, verification used a locally
generated WAV tone (`public/test-tone.wav`) as the hardcoded previewUrl, exposed via a temporary
"Play test tone" button on Home (removed in Phase 3).

**How it was tested:** Ran `npm run dev`, drove the app with Playwright against the real browser
`<audio>` element (not mocked) —
1. Player bar showed the correct empty state before any playback.
2. Clicking "Play test tone" set `audio.src`, started playback (`paused: false`,
   `currentTime` advancing), and updated the player bar with track name/artist/artwork.
3. Clicking play/pause toggled `audio.paused` both directions and the icon swapped ⏸/▶.
4. Dragging the volume slider to 0.4 updated `audio.volume` to exactly 0.4.
5. Switched tabs (Home → Vibe Pulse) mid-playback: `audio.currentTime` kept advancing
   uninterrupted and the player bar continued showing the same track — confirms the shared
   `<audio>` element survives navigation as designed.
6. Skip prev/next buttons correctly disabled (queue length 1).

**Result:** ✅ Working as expected, including the tab-persistence integration point. Ready for
Phase 3 (Home with real iTunes tracks). Live iTunes previewUrl playback will be confirmed once
Phase 3 code is deployed or run on a machine with normal internet access.

### Phase 3 — Home with real iTunes tracks (2026-07-05)

**What was built:** `api/itunes.js` with `searchTracks(term, limit)` and
`searchByArtistTrack(artist, track)`, both calling the real `GET https://itunes.apple.com/search`
endpoint and normalizing results to `{ id, trackName, artistName, artworkUrl, previewUrl }`,
filtering out results with no `previewUrl`. `components/cards/TrackCard.jsx` (shared card, used
again in Vibe Pulse from Phase 5) with artwork, hover-to-reveal play button, track/artist text,
and an optional `thumbs` prop for later phases. `Home.jsx` rewritten to fire the 3 seed queries
("top hits 2026", "chill pop", "hip hop hits") in parallel on mount via `Promise.all`, render
sectioned grids, and wire each card's click to `PlayerContext.play(track, sectionTracks)` — passing
the section as the queue so skip/prev work across a section. The temporary "Play test tone" button
from Phase 2 was removed now that real cards exist.

**How it was tested:** Ran `npm run dev`. Since itunes.apple.com is unreachable from this sandbox,
used Playwright's `page.route()` to intercept `https://itunes.apple.com/search**` and return a
mocked response in the real API's JSON shape (`results: [{trackId, trackName, artistName,
artworkUrl100, previewUrl}]`), with `previewUrl` pointed at the local test tone — this exercises
the actual `fetch`/`.json()`/normalize/render code path, only the network transport is stood in
for. Verified: all 3 section headers rendered ("Top Hits 2026", "Chill Pop", "Hip Hop Hits"), 12
track cards rendered total (4 per section from the mock), clicking the first card started real
`<audio>` playback (`paused: false`, `currentTime` advancing) and updated the player bar with the
correct track/artist, clicking a second card in the same section correctly enabled the "previous"
button (queue/index logic working), confirming the Home → shared player integration point.

**Result:** ✅ Working as expected with mocked transport. Ready for Phase 4 (Taste Anchors).
Live iTunes network calls need to be confirmed on Vercel or the user's own machine — flagged for
a final live check before considering the app fully verified end-to-end.

### Phase 4 — Taste Anchors chip-tap flow (2026-07-05)

**What was built:** `lib/storage.js` (localStorage keys + get/set helpers) and
`hooks/useLocalStorage.js` (generic hook backing all persisted state going forward).
`components/tasteAnchors/ChipGroup.jsx` (chip buttons with a `max` selection cap).
`TasteAnchorsModal.jsx` — 4-step wizard (3 styles → 3 artists → 2 directors/composers → 1 singer)
from static curated chip lists, Next disabled until the step's exact count is picked, Back to
revisit, final step writes `{styles, artists, directors, singer, updatedAt}` via `onSave`.
`TasteBanner.jsx` — dismissible contextual banner. `App.jsx` restructured into an `AppShell` (inside
`PlayerProvider`, so it can read `currentTrack`) that counts real track plays, shows the banner once
`playCount >= 3` and `tasteAnchors` is unset, and wires the Sidebar's "Update your taste" button to
open the same modal on demand regardless of play count.

**How it was tested:** Ran `npm run dev` with the same Playwright iTunes-route mock as Phase 3.
Verified: (1) sidebar "Update your taste" opens the modal directly and the X closes it; (2) the
banner is absent at 0 and 1 plays, appears exactly at the 3rd real card-click/play; (3) dismissing
the banner hides it; (4) stepping through all 4 chip steps enforces exact counts (Next stays
disabled until 3/3/2/1 are selected), Back navigates correctly, and the final button reads "Save";
(5) after saving, `localStorage.tasteAnchors` matched the documented schema exactly:
`{"styles":["Pop","Hip-Hop","R&B"],"artists":[...],"directors":[...],"singer":[...],"updatedAt":"..."}`;
(6) after saving, a 4th play does **not** re-show the banner, confirming the `!tasteAnchors` gate.
Also visually confirmed via screenshot: banner styling and the chip modal (step indicator, chip
grid, Next/Back) match the intended look.

**Result:** ✅ Working as expected, including the banner ↔ player-plays integration point. Ready
for Phase 5 (Vibe Pulse tab). This phase has no external network dependency, so no mocking
caveat applies here.

