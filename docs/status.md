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
| 2026-07-05 | User will add the Groq key via Vercel project environment variables (not a local `.env`), consistent with the earlier "mock in-sandbox, verify live later" decision — Phase 5 will be built and locally verified with a mocked Groq response, with the real live call confirmed after Vercel deploy. |
| 2026-07-05 | Added `docs/phases.md`: a phase-wise architecture reference (what each of the 9 phases touches, its API calls, and its integration point with prior phases) — companion to the fuller `technical-flow.md`. |
| 2026-07-05 | Per user request: Groq calls will support up to 5 API keys via `VITE_GROQ_API_KEYS` (comma-separated), with automatic failover to the next key on a retryable error (401/403/429/network failure). Sticky on the last-successful key rather than round-robining every call. Implemented in `api/groq.js` during Phase 5. |
| 2026-07-05 | Phase 5 scope kept to the daily mood-cloud path only (per the spec's own build-order split) — the manual "change my vibe" button and thumbs feedback are deliberately deferred to Phase 6, even though the feature-description section groups them together. Reused the same `runMoodQuery`/Groq/iTunes pipeline so Phase 6 only adds a second entry point, not new logic. |
| 2026-07-05 | `returnToArtistRate` attribution tagged at the API layer: `itunes.js`'s `searchTracks`/`searchByArtistTrack` now take a `source` param (`'home'`/`'vibepulse'`, defaulted appropriately) embedded directly on each normalized track object, rather than mapping it on in each page. `PlayerContext.play()` reads `track.source` to attribute plays for the metric. |
| 2026-07-05 | Found and fixed a real bug during Phase 7 testing: `PlayerContext.play()` was invoking side effects (`audio.play()`, `recordArtistPlay()`) inside a `setCurrentTrack(prevTrack => ...)` functional updater. React can invoke state updaters more than once (observed under dev StrictMode — `[metrics]` logs showed `artistPlay` firing twice per click), which double-counted metrics. Fixed by reading the previous track from a ref (`currentTrackRef`) and running all side effects directly in the event handler, not inside any setState updater. |
| 2026-07-05 | Repositioned `DebugMetricsPanel` from fixed top-right to fixed bottom-right (above the player bar) after Playwright testing showed it overlapping and intercepting clicks on the Vibe Pulse mood cloud's dismiss button — both were anchored to the same screen region. |
| 2026-07-06 | **Reverted Phase 7 entirely per user request.** The Debug Metrics panel isn't a user-facing feature real Spotify would ship (that instrumentation lives in an internal analytics dashboard, not the client), and the user wants only user-specific features in this prototype. Removed `lib/metrics.js`, `components/debug/DebugMetricsPanel.jsx`, the "Debug Metrics" top-bar button, all `record*` calls from `PlayerContext`/`VibePulse.jsx`/`SuggestionGrid.jsx`, the now-dead `source` tagging in `itunes.js` (it only existed to feed `returnToArtistRate`), and the unused `VIBE_PULSE_METRICS` storage key. Verified via Playwright that Home, Vibe Pulse, and thumbs feedback all still work correctly with zero references to metrics/debug remaining in `src/`, and that the production build succeeds. |
| 2026-07-06 | **Simplified Taste Anchors per user request.** Dropped the "styles/genres" category entirely (user: "leave the styles thing why is that needed"). Also dropped separate "music directors" and "singer" categories — merged into "artists," which is now drawn from a language-specific pool. Final flow: pick 1 language → pick 3 artists from that language's curated pool. `localStorage.tasteAnchors` schema is now `{language, artists, updatedAt}`. |
| 2026-07-06 | Used live `WebSearch` (not just training memory) to identify actually-trending Gen Z-relevant artists per language before curating the per-language pools, per user request ("check for the trendy songs among genz... suggest the artists"). Found real July 2026 data: Drake/Taylor Swift/Bad Bunny topping global streams, Bruno Mars/Justin Bieber/The Weeknd leading monthly listeners; Punjabi music at 39% share of India's regional streaming led by AP Dhillon/Diljit Dosanjh; Akasa as a 2025-26 Bollywood breakout; and Gen-Z-specific 2026 names (Tsumyoki, W.i.S.H, Reble) surfaced in India-focused coverage that wouldn't have come from static memory. Tamil/Telugu/Korean pools remained based on general knowledge since the search didn't surface fresher names for those — flagged as such to the user before implementing. |
| 2026-07-06 | Fixed a real UX bug in `ChipGroup.jsx` while building the language step: single-select (`max=1`) chip groups previously disabled all other options once one was picked, forcing a deselect-then-reselect to change your answer. Now `max > 1` is required to trigger the "disable when full" behavior, so single-select behaves like a proper radio group — click any option to switch directly. This was a latent bug since the original "singer" step (also `max=1`), just never surfaced/fixed until now. |
| 2026-07-06 | Added a "No new songs" button (user chose this label over "Stick to my old songs" — shorter, matches the existing pill-button styling of "Change my vibe") next to `ChangeVibeButton` in Vibe Pulse. It skips the mood cloud entirely and calls Groq with a new `mode: 'familiar'` system prompt — the inverse of the discovery prompt, explicitly asking for well-known tracks by the user's own taste-anchor artists rather than discovery picks. Reuses the same iTunes resolution and `SuggestionGrid` rendering; `SuggestionGrid` now takes a `heading` prop instead of deriving text from `mood` directly, so the familiar-mode heading ("Your familiar favorites") reads naturally instead of `For your "familiar" mood`. |
| 2026-07-05 | Phase 8 polish: replaced emoji-based playback controls (⏮⏸⏭▶🔊) with hand-drawn SVG icons (`components/icons/PlaybackIcons.jsx`) — emoji render inconsistently across systems/browsers and don't match Spotify's icon language. Kept thumbs up/down as emoji (👍👎), a deliberate, common choice for reaction icons distinct from core transport controls. Also replaced the native `<input type=range>` volume control with a custom click-to-set slider (`VolumeSlider.jsx`) matching the look of the existing `ProgressBar`, since native range inputs render as a bulgy OS-styled widget that doesn't match Spotify's thin minimal sliders. |
| 2026-07-06 | Mood picker (`MoodCloud`) changed from an inline card to a proper centered modal overlay (dark backdrop, matching `TasteAnchorsModal`'s visual pattern) after user feedback that the daily/manual mood prompt wasn't noticeable enough blended into the page. `ChangeVibeButton` also given a visible "Change my vibe" text label (previously icon-only with just a hover tooltip), matching `NoNewSongsButton`'s existing pill style — both buttons were "not clear" per user feedback. |
| 2026-07-06 | Taste Anchors languages changed per user request: dropped Punjabi/Korean, now English/Tamil/Hindi/Telugu/Malayalam + an "Other" chip that reveals a free-text input for a custom language (the one deliberate exception to the "chips, not text inputs" rule, since there's no way to pre-curate every possible language). Custom/"Other" languages fall back to a generic global artist pool since there's no curated list for arbitrary text input. Moved Sai Abhyankkar from a (wrongly assumed) Telugu pool to Tamil, confirmed via web search — he's described as India's first Tamil pop star, Chennai-born. Added a curated Malayalam pool (Sithara Krishnakumar, Vijay Yesudas, Haricharan, Sooraj Santhosh, Vineeth Sreenivasan) using the same live-search-based approach as before. |
| 2026-07-06 | **Fixed a real recommendation-quality bug** reported by the user testing the live deploy: picking Tamil as the language still produced a Telugu-sounding suggestion, and only 1 of 6 suggestions resolved to a playable track. Root cause (reasoned from code review, since this sandbox can't reach the live Groq/iTunes APIs to reproduce directly): (1) `searchByArtistTrack` only fetched `limit=1` and blindly trusted iTunes's fuzzy top hit, with no relevance check against the requested artist, and (2) it never passed a `country` param, so it always searched the thin-coverage default US storefront instead of the Indian one where Tamil/Telugu/Hindi/Malayalam content actually lives. Fixed by: fetching `limit=5` and preferring the candidate whose artist name actually matches (diacritic/case-insensitive) the requested artist, falling back to the first candidate only if none match; adding a `country` param (`COUNTRY_BY_LANGUAGE`, `IN` for the four Indian languages) derived from `tasteAnchors.language`; bumping the Groq-requested track count from 6 to 10 for more surviving candidates after iTunes filtering; and rewriting both Groq system prompts to state the taste anchors are "hard constraints, not vague hints" rather than the previous soft "prioritize" language. This could only be verified via mocked Playwright tests confirming the correct `country`/`limit` params and prompt wording are sent — actual live recommendation quality needs to be re-confirmed by the user on the real deployment. |
| 2026-07-06 | Added a lightweight, non-auth "profile name" (`ProfileBadge.jsx`) per user request ("some x name" — not real identity) — a circular initial avatar + editable display name, defaulting to "Guest", stored in `localStorage.profileName`, click-to-edit inline. Placed in the top-right of `TopBar`, mirroring where Spotify shows its account avatar. |
| 2026-07-06 | **Visual fidelity pass** after the user shared real Spotify screenshots (logged-out and logged-in) and said the app "does not look like Spotify." Biggest gap identified: the top bar had no search input at all (Spotify's most iconic UI element) and used generic back/forward chevrons Spotify's actual top bar doesn't show. Rebuilt `TopBar.jsx`: a white circular Home icon button + a white search pill ("What do you want to play?", Enter navigates to the Search tab stub) replacing the chevrons and the old text page-title (dropped since real Spotify's top bar has no title text — each page already renders its own heading). Also fixed the sidebar's "Update your taste" panel, which previously force-filled all remaining sidebar height as an empty gray box (`flex-1`) — now a compact card with an icon, matching the visual weight of Spotify's own sidebar cards instead of reading as a broken/empty feature area. Kept the green/black branding as-is per the user's explicit instruction. Did not attempt to replicate Library/playlist rows, Premium upsell, or notification/friend icons — those are real Spotify features never in this app's scope, and adding non-functional decorative buttons for them would violate the no-dead-UI principle. |
| 2026-07-06 | **Major follow-up batch** after the user shared two more real Spotify screenshots (scrollable library + footer) and described a substantially expanded onboarding/Vibe Pulse flow. Confirmed 3 open questions before building: (1) keep the contextual "update your taste" banner as a fallback if the new forced first-load popup is closed without finishing — yes; (2) apply the new list-style suggestion display everywhere in Vibe Pulse, not just the new onboarding chain — yes, one consistent component; (3) the sidebar's new "Preferences" tab should be a brand-new compact inline editor, not a reuse of the existing popup modal — user explicitly chose the new-inline-editor option. Extracted shared taste data (`LANGUAGES`, `ARTISTS_BY_LANGUAGE`, `DEFAULT_ARTIST_POOL`, `countryForLanguages`, `artistPoolForLanguages`) into `lib/tasteData.js` since two editors (the popup and the new inline one) now both need it — avoids duplicating the pools and risking them drifting out of sync. |
| 2026-07-06 | Taste Anchors language step changed from single-select to **multi-select, up to 2 languages** (`MAX_LANGUAGES` in `tasteData.js`). Artist step now shows the deduped union of both languages' pools (`artistPoolForLanguages`). `groq.js` prompts updated to say "1-2 preferred languages" instead of a single language; `tasteAnchors.languages` is now an array (was `language: string`) — `countryForLanguages` picks the first selected language that maps to a storefront (e.g. `IN`), falling through to the US default if none do. |
| 2026-07-06 | **Reversed the earlier "don't force onboarding on first load" decision, per explicit user request this time.** Added `localStorage.onboardingSeen` (distinct from `tasteAnchors` itself) so the forced popup fires exactly once ever, not on every reload if closed without finishing — the existing contextual banner (after 3 plays) remains as the fallback nudge in that case, confirmed with the user before building. On successful save *specifically from the forced onboarding instance* (tracked via a transient `isOnboardingFlow` flag in `AppShell`, not persisted), the app auto-navigates to Vibe Pulse and auto-opens the mood picker (`VibePulse` accepts `autoOpenMoodPicker`/`onAutoOpenHandled` props for this one-shot chain) — this does not happen when Preferences is edited later via the sidebar or the banner, only right after first-time onboarding. |
| 2026-07-06 | `MoodCloud` mood-tap behavior changed: tapping a mood chip now only highlights it locally; the actual Groq call fires when a new floating "Set" button (fixed bottom-right, positioned above the player bar to avoid the same kind of overlap bug found with the old Debug Metrics panel) is clicked. This matches the user's requested confirm-before-submit flow. |
| 2026-07-06 | Vibe Pulse suggestions changed from a card grid (`SuggestionGrid`) to a row-based list (`SuggestionList`) — small thumbnail, track/artist inline, play icon on hover, thumbs at the row end — applied to every Vibe Pulse result path (daily, manual change-vibe, no-new-songs) for one consistent display, per the user's confirmed preference. Home's `TrackCard` grid is unchanged — the list-view request was specific to Vibe Pulse's individual track recommendations, not Home's playlist-style browsing, which is consistent with how real Spotify itself uses cards for playlists/albums but rows for individual tracks within a list. |
| 2026-07-06 | Sidebar's "Your Library" panel rebuilt: independently scrollable (separate from main-content scroll), collapsible via a toggle arrow, with two pill tabs — **Artists** (reads `tasteAnchors.artists`, a genuine reuse of existing data rather than a fake/empty tab) and **Preferences** (`InlinePreferencesEditor`, the new compact editor). Deliberately did not add "Playlists" or "Podcasts" tabs like real Spotify's — this app has no playlist-creation or podcast features at all, and empty/non-functional tabs would be dead UI. |
| 2026-07-06 | Added `Footer.jsx` (Company/Communities/Useful links/Spotify Plans columns, social icons, legal row, "© 2026 Spotify AB") rendered at the bottom of `MainLayout`'s scrollable main content on every page, matching the real Spotify screenshots. Social icons and footer links are decorative (no real navigation) since they'd otherwise send users to spotify.com from this private prototype. |

## Phase status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Architecture proposal | ✅ Confirmed by user |
| 0.5 | Docs folder (technical-flow.md, status.md) | ✅ Done |
| 1 | Scaffold Vite+React+Tailwind, dark shell, sidebar/topbar | ✅ Done — verified in browser |
| 2 | Persistent bottom player (hardcoded preview) | ✅ Done — verified in browser |
| 3 | Home page, real iTunes tracks | ✅ Done — verified with mocked network transport |
| 4 | Taste Anchors chip-tap flow | ✅ Done — verified in browser |
| 5 | Vibe Pulse tab (mood cloud → Groq → iTunes → cards) | ✅ Done — verified with mocked network transport |
| 6 | Thumbs up/down + change-my-vibe button | ✅ Done — verified with mocked network transport |
| 7 | Debug Metrics panel | ❌ Reverted per user request (2026-07-06) — not a user-facing feature, removed entirely |
| 8 | Visual polish | ✅ Done — verified in browser |
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

### Phase 5 — Vibe Pulse tab (2026-07-05)

**What was built:** `api/groq.js` — `getMoodRecommendations(tasteAnchors, mood)` calling the real
Groq chat-completions endpoint with the exact system prompt from the spec, `response_format:
json_object`, plus multi-key rotation (`VITE_GROQ_API_KEYS`, sticky index, rotates forward on
401/403/429/network failure, throws once all configured keys are exhausted). `MoodCloud.jsx` —
8 mood words as clickable chips with per-chip pseudo-random rotation/size/vertical offset for a
genuine scattered layout, always dismissible. `SuggestionGrid.jsx` — renders resolved suggestions
as the same `TrackCard` used on Home. `VibePulse.jsx` — daily-cap gate reading/writing
`localStorage.dailyVibePrompt` (`{lastShownDate, lastResponse}`), orchestrates
mood tap → `getMoodRecommendations` → `Promise.all(searchByArtistTrack)` → render, with loading and
inline-error states. Manual "change my vibe" and thumbs feedback intentionally deferred to Phase 6.

**How it was tested:** Ran `npm run dev` with `VITE_GROQ_API_KEYS` set for the rotation test and a
single fake key otherwise. Mocked both `api.groq.com` and `itunes.apple.com` via Playwright's
`page.route()` (neither reachable from this sandbox) — the mocks stand in only for network
transport; `api/groq.js`, `api/itunes.js`, and all the React orchestration ran unmodified. Verified:
(1) mood cloud shows all 8 moods scattered (confirmed visually via screenshot — varying rotation/
size/offset, not a grid); (2) tapping a mood fires **exactly 1 Groq call** carrying the real system
prompt + `{tasteAnchors, mood}, then up to 6 parallel iTunes lookups, rendering 6 suggestion cards;
(3) `dailyVibePrompt` written correctly as `{"lastShownDate":"<today>","lastResponse":"picked"}`;
(4) clicking a suggestion card plays through the same shared `PlayerContext` used by Home —
confirmed via real `<audio>` state (`paused:false`, `currentTime` advancing) and the player bar
showing the correct track — this is the explicit Home/Vibe-Pulse-share-a-player integration point
required by the task; (5) reloading the same day correctly suppresses the mood cloud and shows the
"already picked" placeholder instead; (6) dismissing the cloud writes
`{"lastResponse":"dismissed"}`, hides the cloud, and does **not** block the rest of the app;
(7) **key rotation**: with `VITE_GROQ_API_KEYS="bad-key-1,bad-key-2,good-key-3"` and the mock
returning 401 for the first key and 429 for the second, the app tried all three keys in order
(confirmed via captured `Authorization` headers) and succeeded on the third, rendering 6
suggestions with no user-visible error; (8) with all keys mocked to fail, the app shows a clean
inline error message (no crash, no unhandled promise rejection).

**Result:** ✅ Working as expected, including both integration points (shared player, key
rotation). Ready for Phase 6 (thumbs + manual change-my-vibe). Live Groq/iTunes calls still need
confirmation on Vercel or the user's machine.

### Phase 6 — Thumbs up/down + manual "change my vibe" (2026-07-05)

**What was built:** `ChangeVibeButton.jsx` — a persistent shuffle-glyph icon next to the "Vibe
Pulse" header, always visible regardless of the daily cap, opening the same `MoodCloud` as a
one-off manual flow (`manualPromptOpen` state in `VibePulse.jsx`) that reuses the exact same
`runMoodQuery` → Groq → iTunes pipeline from Phase 5 without touching `dailyVibePrompt` at all.
`SuggestionGrid.jsx` updated to read/write `localStorage.vibePulseFeedback`
(`{"<artistName>::<trackName>": "up"|"down"}`) via `TrackCard`'s existing `thumbs` prop — this key
is deliberately separate from `tasteAnchors` (comment in the code notes this mirrors the product
requirement that Vibe Pulse feedback must never silently alter the user's primary
recommendations).

**How it was tested:** Ran `npm run dev` with the same Groq/iTunes route mocks as Phase 5,
pre-seeding `dailyVibePrompt` to simulate "already picked today." Verified: (1) the change-vibe
button is visible and the "already picked" empty state shows correctly even with the daily cap
exhausted; (2) clicking it opens the mood cloud, picking a mood fires exactly 1 Groq call and
renders 6 suggestions; (3) `dailyVibePrompt` is provably untouched by the manual flow (compared
before/after, byte-for-byte equal); (4) thumbs up on suggestion 1 and thumbs down on suggestion 2
both wrote correctly to `vibePulseFeedback` (`{"Artist::...Song 1":"up","Artist::...Song 2":"down"}`);
(5) `tasteAnchors` was confirmed unchanged after thumbs feedback, proving the isolation; (6) clicking
a thumbs icon did not change `audio.src`, confirming `stopPropagation` correctly prevents thumbs
clicks from also triggering playback. Visually confirmed via screenshot: shuffle icon renders next
to the header, thumbs icons render under each card and highlight gold when tapped.

**Result:** ✅ Working as expected, including the "manual bypasses daily cap" and "feedback stays
isolated from taste profile" integration points. Ready for Phase 7 (Debug Metrics panel).

### Phase 7 — Debug Metrics panel (2026-07-05)

**What was built:** `lib/metrics.js` — recorder functions
(`recordSuggestionsShown`, `recordThumbsFeedback`, `recordVibeButtonTap`,
`recordDailyVibeResponse`, `recordArtistPlay`, `recordListeningTime`) writing to
`localStorage.vibePulseMetrics`, each `console.log`-ing its event, plus `computeDerivedMetrics()`
for the displayed percentages, and a `CustomEvent`-based `onMetricsUpdated` subscription so the
panel refreshes live. `DebugMetricsPanel.jsx` renders all 5 spec metrics with supporting counts.
Wired recorders at the exact point each event happens: `PlayerContext.play()` →
`recordArtistPlay`/interval-based `recordListeningTime` while `isPlaying`; `VibePulse.jsx` →
`recordDailyVibeResponse` on pick/dismiss, `recordVibeButtonTap` on the shuffle icon,
`recordSuggestionsShown` after a mood query resolves; `SuggestionGrid.jsx` →
`recordThumbsFeedback`, counting a track only once even if the user changes their thumbs vote.
`itunes.js` updated to tag each track with a `source` (`'home'`/`'vibepulse'`) so
`returnToArtistRate` can be attributed correctly. Toggled via the existing "Debug Metrics" button
in the top bar.

**How it was tested:** Ran `npm run dev` with the same Groq/iTunes mocks as prior phases. Verified,
in order: (1) panel opens from the top bar showing all-zero initial state; (2) playing a Home
track and waiting ~3.5s shows listening time tick to `0m 3s`; (3) picking a daily mood shows
`suggestionsShown` +6 and daily participation `100% (1/1)`; (4) thumbs-up one suggestion and
thumbs-down another shows `suggestionsRated` = 2/6, and **re-clicking thumbs-up on an
already-rated track does not double count** (still 2, not 3); (5) tapping "change my vibe"
increments its counter; (6) playing the same artist twice (once via a Vibe Pulse suggestion, once
via a second manual mood round) correctly shows 1 introduced / 1 replay (100%); (7) the panel
closes via its own X and reopens via the top-bar toggle.

**Bugs found and fixed during this phase's testing (not simulated — both surfaced from real
Playwright runs against the actual code):**
- `PlayerContext.play()` had side effects (`audio.play()`, `recordArtistPlay()`) running inside a
  `setCurrentTrack(prevTrack => ...)` functional updater. The `[metrics]` console log showed
  `artistPlay` firing twice for a single click (React invoked the updater twice under dev
  StrictMode), which inflated the replay count (3 replays instead of the correct 1 for 2 actual
  plays). Fixed by tracking the previous track in a ref and running all side effects directly in
  the event handler, never inside a setState updater.
- `DebugMetricsPanel` (fixed top-right) visually and functionally overlapped the Vibe Pulse mood
  cloud's dismiss button, which occupies the same screen region — Playwright's click actually
  failed with "element intercepts pointer events." Fixed by repositioning the panel to
  fixed-bottom-right, above the player bar.

**Result:** ✅ Working as expected after both fixes; metric counts are now internally consistent
(replay count matches actual play count). Ready for Phase 8 (visual polish).

**Update (2026-07-06): Phase 7 reverted entirely.** After discussing what the Debug Metrics panel
was for, the user decided they only want user-facing features in this prototype — real Spotify
users never see this kind of instrumentation (it lives in an internal analytics dashboard, not the
client app), so it didn't belong in a polished product prototype. Removed `lib/metrics.js`,
`components/debug/DebugMetricsPanel.jsx`, the "Debug Metrics" top-bar toggle, every `record*` call
from `PlayerContext.jsx`/`VibePulse.jsx`/`SuggestionGrid.jsx`, the `source` tagging in `itunes.js`
(it only existed to attribute `returnToArtistRate`), and the unused `vibePulseMetrics`
localStorage key. Re-verified via Playwright: no "Debug Metrics" text anywhere in the app, Home
cards still play, the Vibe Pulse mood cloud/Groq/iTunes pipeline still works, thumbs feedback still
writes to `vibePulseFeedback` correctly, and `npm run build` still succeeds (bundle shrank
slightly, ~216KB vs ~221KB, consistent with the removed code). No regressions.

### Taste Anchors simplification + "No new songs" button (2026-07-06)

**What was built:** `TasteAnchorsModal.jsx` rewritten from a 4-step wizard (styles/artists/
directors/singer) down to 2 steps: pick 1 language (`LANGUAGES`), then pick 3 artists from a
language-matched pool (`ARTISTS_BY_LANGUAGE`, curated using live web search results for
current/Gen-Z-relevant trends, not just static training knowledge). `ChipGroup.jsx` fixed so
single-select (`max=1`) groups act as a proper radio group instead of disabling all other options
once one is picked. `api/groq.js` now takes a `mode` param (`'discovery'` default or `'familiar'`)
selecting between two system prompts. `NoNewSongsButton.jsx` added next to `ChangeVibeButton` in
`VibePulse.jsx`; tapping it calls `runMoodQuery('familiar', 'familiar')` directly — no mood cloud
needed — using the familiar-mode prompt. `SuggestionGrid.jsx` now takes a `heading` prop (computed
in `VibePulse.jsx` based on mode) instead of deriving text from a raw mood string.

**How it was tested:** Ran `npm run dev` with the same Groq/iTunes Playwright route mocks used
throughout. Verified: (1) Taste Anchors modal is now 2 steps with the correct headings; (2)
clicking a second language chip (e.g. Punjabi after Hindi) switches directly in one tap — confirms
the `ChipGroup` radio-group fix; (3) the artist pool shown updates to match the selected language
(confirmed Punjabi → AP Dhillon/Diljit Dosanjh/Sidhu Moose Wala/Karan Aujla); (4) saving writes the
exact new schema `{"language":"Punjabi","artists":[...],"updatedAt":"..."}`; (5) a normal mood pick
sends `tasteAnchors` (language+artists) and the mood to Groq using the discovery system prompt,
heading reads `For your "chill" mood`; (6) tapping "No new songs" fires a second Groq call using
the familiar system prompt without ever showing the mood cloud, heading reads "Your familiar
favorites"; exactly 2 total Groq calls for the 2 actions taken (1 each, confirming no duplicate
calls). Visually confirmed via screenshot: the button renders correctly next to the shuffle icon
with a crossed-out-shuffle glyph and clear "No new songs" label.

**Result:** ✅ Working as expected, no regressions. `npm run build` succeeds.

### Phase 8 — Visual polish (2026-07-05)

**What was built:** Audited the running app visually via Playwright screenshots first. Found the
player bar's transport controls (skip/play/pause) and volume icon were emoji glyphs, which render
inconsistently across systems and don't match Spotify's actual icon language — the volume emoji in
particular rendered barely legible in the screenshot. Built `components/icons/PlaybackIcons.jsx`
(hand-drawn SVGs for play/pause/skip-previous/skip-next/volume, styled close to Spotify's actual
icon set) and used them in `PlayerBar.jsx` and `TrackCard.jsx`. Replaced the native
`<input type=range>` volume control with `VolumeSlider.jsx`, a custom click-to-set slider matching
the existing `ProgressBar`'s look (thin track, white/green fill, hover-revealed thumb) instead of
the bulgy OS-native range widget. Kept thumbs up/down as emoji (👍👎) — a deliberate choice, since
those are reaction icons rather than core transport chrome. Fixed `TrackCard`'s play/pause overlay
to stay visible (not just on hover) when that card is the one currently playing, matching real
Spotify behavior. Added a time-of-day-based greeting ("Good morning/afternoon/evening") to Home,
replacing a missing/hardcoded header.

**How it was tested:** Ran `npm run dev`, took before/after screenshots of the player bar and Home
grid. Re-ran functional checks against the new icons/slider to confirm nothing regressed: skip
buttons' disabled/enabled state still correctly reflects queue position, play/pause toggling still
flips `audio.paused`, and clicking ~30% along the new custom volume slider set `audio.volume` to
exactly `0.30`. Visually confirmed the new SVG icons render crisp and consistent (no more
barely-visible speaker emoji), and the volume slider now matches the progress bar's visual
language.

**Result:** ✅ Working as expected, no regressions. Ready for Phase 9 (deploy to Vercel).

### Follow-up — Onboarding redesign, multi-language, list view, sidebar/footer (2026-07-06)

**What was built:** See the decision-log entries above for the full breakdown. In short:
`lib/tasteData.js` (shared taste constants/helpers), multi-language (max 2) taste anchors with a
union artist pool, forced first-load onboarding (`onboardingSeen`) chaining straight into an
auto-opened mood picker on Vibe Pulse, a floating "Set" button confirming mood selection before
the Groq call fires, `SuggestionList` (list rows) replacing `SuggestionGrid` (cards) everywhere in
Vibe Pulse, a collapsible/scrollable sidebar library with Artists + Preferences (inline editor)
tabs, and a Spotify-style `Footer.jsx` on every page.

**How it was tested:** Ran `npm run dev` with the usual Groq/iTunes Playwright route mocks.
Verified, in order: (1) the Taste Anchors modal force-opens on first load with the "(up to 2)"
heading; (2) picking English + Tamil correctly disables the 3rd language chip and the artist step
shows the deduped union of both pools (11 unique artists, including Sai Abhyankkar); (3) saving
writes `{"languages":["English","Tamil"],"artists":[...]}`; (4) immediately after saving, the app
auto-navigates to Vibe Pulse **and** auto-opens the mood cloud without any further clicks; (5)
tapping a mood chip highlights it and makes the floating Set button appear, but fires **zero**
Groq calls until Set is actually clicked; (6) clicking Set fires exactly 1 Groq call and renders
10 rows in `[data-testid="suggestion-list"]` (not a card grid); (7) the iTunes calls for those
rows correctly carried `country=IN` (Tamil was one of the two selected languages); (8) the
sidebar's Artists tab shows exactly the 3 saved artists, and Preferences tab shows the inline
editor pre-filled with the current selections; (9) the collapse toggle hides and restores the
library content correctly; (10) a `Footer` element with "Spotify Plans" and the copyright line
renders on Home (distinct from the player bar, which is a second, unrelated `<footer>` landmark).
Production build (`npm run build`) succeeds throughout with no errors.

**Result:** ✅ Working as expected, no regressions from prior phases.

### Follow-up — Global floating vibe button, profile privacy, sidebar chrome (2026-07-06)

**What was wrong:** After the previous batch, the user reported (with a screenshot): the "Set"
button only ever appeared transiently inside the mood-cloud modal, not as a persistent
always-available floating button as requested; the "already picked today" empty-state message
still read as a daily restriction even though "Change my vibe" technically bypassed it; the
profile badge showed "Guest" instead of matching their reference screenshot; and the sidebar was
still missing several chrome elements (Create/Expand icons, search+Recents row) present in the
real Spotify screenshots.

**What was built:** `FloatingVibeButton.jsx` — a genuinely persistent floating button (fixed
bottom-left, positioned clear of the mood cloud's own bottom-right "Set" confirm button so the two
never collide), rendered once in `MainLayout` so it's visible on **every tab**, not just Vibe
Pulse. Clicking it from anywhere reuses the same navigate-and-auto-open mechanism built for the
onboarding chain (generalized from `justCompletedOnboarding` to `pendingMoodPicker` in `App.jsx`,
since both the onboarding-complete callback and this button now trigger the identical behavior).
It is never gated by the daily cap. Softened the "already picked" empty-state copy to point at the
floating button and explicitly state there's no daily limit on changing your mind. Bumped both
modal backdrops (`MoodCloud`, `TasteAnchorsModal`) from `bg-black/70` to `/90` so the floating
button doesn't visually bleed through the semi-transparent backdrop when a modal is open. Sidebar
gained decorative Create (+) and Expand icons in the Library header, plus a search icon +
"Recents" label row above the Artists list, matching the reference screenshot layout.

**Profile privacy fix:** the user separately clarified they do not want their real name anywhere
in the code or UI, even as a "default" value — an earlier intermediate version of this fix had
briefly defaulted `ProfileBadge` to their actual first name (inferred from session context) before
this was caught and corrected. `ProfileBadge` now shows **only a round avatar with a single
generic placeholder initial ("P")** — no visible name text at all, matching how real Spotify's own
top bar looks (avatar only, no name label next to it). Default storage value changed to the
literal placeholder string `'P'`, not tied to any real name. Confirmed via `grep` that no personal
name string appears anywhere in the repo.

**Bug found and fixed while testing:** dismissing the onboarding-auto-opened mood cloud
immediately revealed a *second*, separate mood-cloud instance underneath (the daily-prompt
trigger, since first onboarding completion is necessarily also the first Vibe Pulse visit of the
day) — a real double-modal stacking bug, not just a test artifact. Fixed by having the manual
mood-cloud's pick/dismiss handlers also resolve today's daily prompt state when it hasn't been
resolved yet, so interacting with either instance consumes both instead of leaving one stacked
behind the other.

**How it was tested:** Ran `npm run dev` with the usual mocks. Verified: profile badge renders
exactly `"P"` with no other text; the floating button is visible on Home (not just Vibe Pulse);
clicking it from Home navigates to Vibe Pulse and opens the mood cloud; picking a mood + Set fires
1 Groq call, and clicking the floating button again immediately afterward reopens the mood cloud
with zero blocking, and a second pick fires a 2nd Groq call in the same session — confirming no
daily cap on the manual path; dismissing the onboarding mood cloud now closes it fully in one tap
(no more stacked second modal); sidebar Create/Expand icons and the Recents row are present.
`npm run build` succeeds.

**Result:** ✅ Working as expected, including the fixed double-modal bug. No regressions.

### Follow-up — Set button placement, onboarding re-verification, listening history (2026-07-06)

**What was reported:** (1) the "Set" confirm button was still a separate viewport-corner floating
element, not attached below the mood chips inside the modal as the user's screenshot showed; (2)
the user believed the first-load onboarding popup "still wasn't being done"; (3) "No new songs"
should factor in the user's real listening history and stay relevant to whatever vibe/mood they
last set, instead of blindly returning generic favorites.

**Set button:** Moved out of the separate `fixed bottom-28 right-6` viewport-corner button and into
the modal card itself, rendered directly below the mood chips (centered, normal document flow) —
confirmed via a DOM containment check (`modal.contains(setButton)` → `true`) that it's now a true
child of the dialog, not a detached floating element. The separate persistent global
"Set your vibe" trigger button (bottom-left, opens the mood picker from anywhere) is unchanged —
that one is intentionally floating/global by design, distinct from this in-modal confirm button.

**Onboarding re-verified, not re-implemented:** re-tested from a genuinely fresh browser context
(no prior localStorage) and confirmed the popup does force-open correctly — this was already
working from the previous batch. The most likely explanation for the user seeing otherwise: it is
designed to fire only once per browser (tracked by `onboardingSeen`), so a browser/tab that had
already completed it in an earlier round of testing correctly does not show it again on reload —
that's the intended "returning user" behavior, not a bug. Communicated this plainly along with how
to re-test it (clear site data / use a private window) rather than silently assuming it was broken.

**Listening history:** added `lib/listeningHistory.js` — `recordPlayed(track)` (called from
`PlayerContext.play()` every time a genuinely new track starts) appends `{artist, track}` to
`localStorage.listeningHistory`, deduped, capped at the last 20. `getMoodRecommendations` now
accepts a `recentlyPlayed` array, included in the Groq user message; both system prompts updated —
discovery mode is told to avoid re-recommending recently-played tracks, familiar mode is told to
heavily favor artists from real recent listening history over the static onboarding-time list,
since that better reflects current taste. Also fixed a real relevance bug in `handleNoNewSongs`: it
was hardcoding the mood string to `'familiar'` instead of reusing whatever mood the user had
actually last set, so "no new songs" results ignored the current vibe entirely — now reuses
`selectedMood` (falling back to a neutral default only if no mood has been picked yet this
session), and the results heading now reads "Familiar favorites for your '{mood}' mood" instead of
a generic "Your familiar favorites", tying it back to the vibe explicitly.

**How it was tested:** Ran `npm run dev` with the usual Groq/iTunes mocks, starting from a
completely fresh page load (no pre-seeded localStorage) for the onboarding check specifically.
Verified: (1) the onboarding modal genuinely shows on a fresh session; (2) the Set button is a DOM
child of the modal card; (3) after picking "chill" and playing a suggestion, `listeningHistory`
correctly records the real played track; (4) clicking "No new songs" afterward sent that history
in the Groq request (`recentlyPlayed` array with the actual played track) and reused `"chill"` as
the mood rather than a hardcoded placeholder — confirmed via the captured request payload and the
system prompt text; (5) the results heading read `Familiar favorites for your "chill" mood`.
`npm run build` succeeds.

**Result:** ✅ Working as expected. No regressions.

### Follow-up — Preferences popup, round FAB consolidation, contextual thumbs (2026-07-06)

**What was reported:** (1) the user still wasn't seeing the onboarding popup and wanted the sidebar
"Preferences" tab to also open a popup instead of the inline editor built two batches ago
("whats your problem with popup"); (2) the floating vibe button was a rectangular pill with a text
label at bottom-**left**, when the original ask was a round button at bottom-**right**, and having
it alongside the header's "Change my vibe" pill was redundant — "just have a change your vibe
button... keep the one which will be better"; (3) thumbs up/down showing on every suggestion row
upfront made no sense — feedback should only appear once a track has actually been played.

**Preferences → popup:** Reversed the earlier "new inline sidebar editor" decision (the user's own
explicit prior choice) per this new instruction. Deleted `InlinePreferencesEditor.jsx`. Sidebar's
"Preferences" pill is no longer a second content tab — clicking it calls a new `onOpenPreferences`
callback (threaded `App.jsx` → `MainLayout` → `Sidebar`) that opens the same `TasteAnchorsModal`
popup used for onboarding and the contextual banner. "Artists" is now the sidebar's only real
content view.

**Round FAB consolidation:** Deleted `ChangeVibeButton.jsx` entirely (redundant once there's a
global always-visible trigger) and removed it from `VibePulse.jsx`'s header — only `NoNewSongsButton`
remains there, since that's a distinct action (familiar mode), not another way to open the mood
picker. Rebuilt `FloatingVibeButton.jsx` as a genuine circular FAB (56×56, icon-only, no text)
repositioned to `bottom-28 right-6` (previously a pill with a text label at bottom-left) — this is
now the single, consolidated way to trigger the mood picker from anywhere in the app.

**Contextual thumbs:** `SuggestionList` now only renders the thumbs up/down row (with a "Liked
it?" label) for whichever track is currently loaded into the player (`currentTrack?.id ===
track.id`, checked regardless of paused/playing state so feedback stays available after pausing),
not for every row indiscriminately. Feedback is now something you're asked after you've actually
listened to a track, not before.

**How it was tested:** Ran `npm run dev` with the usual mocks, starting from a fresh onboarding
flow. Verified: (1) the floating button is a true circle (`width === height`, 56px) positioned at
the right edge with no visible text; (2) no "Change my vibe" text exists anywhere in the Vibe Pulse
header, while "No new songs" remains; (3) clicking the sidebar's "Preferences" pill opens the
`taste-anchors-modal` popup, and the old inline-editor element no longer exists in the DOM at all;
(4) before playing anything, zero suggestion rows show a feedback control; after clicking to play
row 3 specifically, exactly one row (that one) shows the "Liked it?" thumbs. `npm run build`
succeeds.

**Result:** ✅ Working as expected. No regressions.

### Follow-up — Onboarding sequence fix: delay, close-also-chains, heading (2026-07-06)

**The real gap, finally pinned down:** the user's exact spec — popup 1 (preferences) appears ~1-2s
after load; whether the user completes it *or* just closes it, popup 2 (vibe/mood) comes next;
closing or picking there ends the sequence (playlist shows if they picked); this whole two-popup
chain runs **once ever**. Prior batches had built the "complete preferences → chain to vibe" path
correctly, but **not** the "close preferences without finishing → still chain to vibe" path —
`closeTasteModal()` only marked `onboardingSeen` and stopped, so dismissing the first popup
silently ended the whole sequence instead of continuing to the second popup. That was the actual
bug, not the popup failing to appear at all (verified working in the prior round).

**What was fixed:** (1) `App.jsx`'s mount effect now waits 1.5s (`setTimeout`) before showing the
first-load popup, instead of appearing instantly on render; (2) `closeTasteModal()` now mirrors
`saveTasteAnchors()` — both branches navigate to Vibe Pulse and set `pendingMoodPicker` when
`isOnboardingFlow` is true, so dismissing the preferences popup without finishing still chains
into the vibe popup next, exactly like completing it does. This only applies to the one-shot
onboarding flow (`isOnboardingFlow`), never to Preferences opened later via the sidebar or the
banner — those still just close normally. (3) Added a prominent "Choose your favorites" `<h1>`
title to `TasteAnchorsModal`, with the per-step question demoted to a smaller gray subheading
underneath.

**How it was tested:** Ran two full end-to-end scenarios via Playwright against a genuinely fresh
page load (no pre-seeded localStorage) with the usual Groq/iTunes mocks. **Scenario 1** (close
without finishing): confirmed the modal is not visible at 0s or ~0.9s, but is visible at ~1.8s
(confirming the delay); confirmed the heading reads "Choose your favorites"; clicked Close (X)
without picking anything, and confirmed the app still navigated to Vibe Pulse **and** auto-opened
the mood cloud; dismissed that too and confirmed no further popups appear (normal browsing);
reloaded the page and confirmed the onboarding sequence does **not** fire again (fires once ever,
persisted via `onboardingSeen`). **Scenario 2** (complete normally): confirmed completing
preferences also chains to the vibe popup, and picking a mood + Set displays the suggestion list
("playlist") with 10 rows. `npm run build` succeeds.

**Result:** ✅ Working as expected, matching the exact requested sequence. No regressions.

### Follow-up — "Other" option for artists, not just language (2026-07-06)

**What was asked:** the artist-picking step only offered a curated chip list per language, with no
escape hatch — unlike the language step, which already had an "Other" chip + text box for anyone
whose language wasn't in the curated list. The ask was to give artists the same treatment.

**What was changed:** `lib/tasteData.js` exports a new `OTHER_ARTIST` constant. In
`TasteAnchorsModal.jsx`, the artist step's `ChipGroup` now appends an "Other" chip to the curated
pool. Selecting it (as one of the 3 picks) reveals a text input ("Type an artist name"), mirroring
the language step exactly — same styling, same auto-focus, same clear-on-deselect behavior.
`effectiveArtists` resolves the placeholder to the typed value the same way `effectiveLanguages`
already did for custom languages, so `isComplete` (and the eventual saved `artists` array) is based
on the *typed* name, not the literal word "Other". Re-opening the modal later with a previously
saved custom artist correctly restores it as "Other" selected + the text box pre-filled, same as
custom languages already did.

**How it was tested:** Ran the full flow via Playwright (mocked Groq/iTunes): selected a language,
advanced to the artist step, confirmed the "Other" chip and text box appear, confirmed Next stays
disabled while the box is empty (even with only 1 of 3 slots used) and enables once a name is typed
and 3 total are picked, then verified the saved `localStorage.tasteAnchors` contains the *typed*
artist name in the `artists` array (not the word "Other"). `npm run build` succeeds.

**Result:** ✅ Working as expected. No regressions.

### Follow-up — Go-home on empty dismiss, live preference sync, fuller suggestion lists, copy (2026-07-06)

**What was asked:** (1) dismissing the mood popup without picking a mood should send the user to
Home, not leave them staring at Vibe Pulse's empty "no vibe set" state; (2) editing preferences (or
picking a new mood) while a vibe is already active should refresh the suggestion list automatically,
not require a manual re-trigger; (3) suggestion lists were sometimes visibly shorter than the
promised 10 ("suggest some 10 songs dont stop with 5 alone"); (4) the mood popup's copy said "vibe
today" — should say "vibe now".

**Go-home on empty dismiss:** `App.jsx` now passes an `onGoHome` callback (`() =>
setActiveTab('home')`) into `VibePulse`. Both `handleDailyDismiss` and `handleManualDismiss` call it
whenever `selectedMood` is still null at dismiss time — i.e. the user never actually picked
anything this session — covering the daily prompt, the floating-button-triggered picker, and the
onboarding-chained picker (all three funnel through these same two handlers). If a mood *is*
already active and the user reopens/dismisses the picker again, dismissing just closes it and
leaves the existing suggestions in place — only the genuinely-empty case redirects.

**Live preference sync — real bug, not cosmetic:** `VibePulse` previously read `tasteAnchors` via
its *own* `useLocalStorage` call, completely independent from the copy `App.jsx` uses to drive the
`TasteAnchorsModal`. Since Preferences can be edited without changing tabs (Sidebar's "Preferences"
pill opens the popup while `VibePulse` stays mounted), the two copies could silently diverge —
saving new preferences never reached the already-mounted `VibePulse`, so "the vibe list should
change automatically" was structurally impossible before this fix, not just unimplemented.  Fixed
by lifting `tasteAnchors` fully into `App.jsx` (already the single source of truth for the modal)
and passing it down as a prop instead of re-reading it locally. A new effect in `VibePulse.jsx`
(skipped on first mount via a ref) re-runs the current mood/mode against the latest `tasteAnchors`
whenever that prop changes, so the moment preferences are saved, the list re-fetches itself.
Picking a new mood already re-fetched directly via the existing click handlers — no change needed
there.

**Fuller suggestion lists:** Both Groq system prompts (`groq.js`) now request 16 tracks instead of
10 — a buffer against the fraction that never resolve to a playable iTunes preview — and
`VibePulse.jsx` takes the first 10 successful matches (`.slice(0, 10)`) after resolving. Previously
Groq was asked for exactly 10 and whatever didn't resolve just silently shrank the shown list (e.g.
down to 5); the buffer means the shown list reliably lands at 10 unless iTunes itself is having a
very bad day.

**Copy fix:** `MoodCloud.jsx`'s heading changed from "What's your vibe today?" to "What's your vibe
now?", matching that mood-setting isn't a once-a-day thing in this app.

**How it was tested:** Ran a full Playwright pass (mocked Groq returning 16 tracks/call, mocked
iTunes always resolving) against a fresh session: confirmed the mood popup reads "What's your vibe
now?"; dismissed it without picking and confirmed the app left the Vibe Pulse tab entirely (its
heading disappeared, the Home search bar appeared) instead of showing the empty state; reopened the
picker via the floating button, picked a mood, and confirmed exactly 10 suggestion rows rendered;
opened Preferences from the sidebar while that list was showing, changed the language/artist
selection, saved, and confirmed a second Groq call fired automatically and the suggestion list
re-rendered with the new call's tracks — with no additional click beyond saving preferences.
`npm run build` succeeds.

**Result:** ✅ Working as expected. No regressions.

### Phase 9 — Deploy to Vercel (2026-07-06, in progress)

**Pre-deploy checks done:** Ran `npm run build` — succeeds cleanly (`dist/index.html`,
~23KB CSS, ~221KB JS, gzip ~69KB). Ran `npm run preview` and confirmed the production build serves
and loads (200 OK). Removed dev-only artifacts that had no business shipping: `public/test-tone.wav`
and `scripts/gen-test-tone.mjs` (Phase 2's local audio stand-in, unreferenced since Phase 3) and the
`playwright` devDependency (used only for this session's local verification, not by the app).
Confirmed `dist` and `.env`/`.env.*` are correctly gitignored (`.env.example` stays tracked).

**Vercel reachability:** Confirmed `vercel.com`/`api.vercel.com` are blocked by this sandbox's
egress policy, same as `itunes.apple.com`/`api.groq.com` — so an in-sandbox CLI deploy isn't
possible here either. Deployment is handed off to the user via the GitHub+dashboard flow (or the
Vercel CLI on their own machine), per the task's deployment section.

