# Technical Flow — Spotify Vibe Pulse

Private prototype for a product case study submission. Uses real Spotify branding
(name, wordmark styling, green/black colors) — not for public/commercial release.

## Folder / file structure

```
spotify-vibe-pulse/
├── .env                          # VITE_GROQ_API_KEY (gitignored)
├── .env.example
├── vercel.json                   # only if SPA routing needs it
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx                   # tab switcher + global layout, wraps PlayerContext.Provider
    ├── index.css                 # Tailwind + Spotify base styles
    │
    ├── api/
    │   ├── itunes.js             # searchTracks(query), searchByArtistTrack(artist, track)
    │   └── groq.js               # getMoodRecommendations(tasteAnchors, mood)
    │
    ├── context/
    │   └── PlayerContext.jsx     # shared <audio> element + play state
    │
    ├── hooks/
    │   └── useLocalStorage.js    # generic get/set/sync hook
    │
    ├── lib/
    │   ├── storage.js            # localStorage keys + get/set helpers
    │   └── tasteData.js          # LANGUAGES, ARTISTS_BY_LANGUAGE, country/pool helpers (shared by both taste editors)
    │
    ├── components/
    │   ├── layout/ (Sidebar, TopBar, MainLayout, Footer, ProfileBadge)
    │   ├── player/ (PlayerBar, ProgressBar, VolumeSlider)
    │   ├── icons/ (PlaybackIcons)
    │   ├── cards/ (TrackCard — used by Home)
    │   ├── tasteAnchors/ (TasteAnchorsModal, ChipGroup, TasteBanner)
    │   └── vibePulse/ (MoodCloud, FloatingVibeButton, NoNewSongsButton, SuggestionList)
    │
    └── pages/
        ├── Home.jsx
        ├── VibePulse.jsx
        ├── Search.jsx            # minimal stub, nav item only
        └── Library.jsx           # minimal stub, nav item only
```

## Component responsibilities

- **App.jsx** — owns active tab state, renders MainLayout (Sidebar + TopBar + page + Footer + PlayerBar), wraps in PlayerContext.Provider. Also owns the first-load forced onboarding flow (see below).
- **PlayerContext** — single `<audio>` ref, survives tab switches. Exposes `{ currentTrack, isPlaying, play(track), togglePlay(), seek(), setVolume(), progress, duration }`. Track shape: `{ trackName, artistName, artworkUrl, previewUrl }`.
- **PlayerBar** — pure consumer of PlayerContext; artwork/name/artist, play/pause, skip, progress (drag-to-seek within 30s clip), volume.
- **Home.jsx** — on mount, fires 3 seed queries in parallel via itunes.js, renders sectioned card grids. Card click → `player.play(track)`.
- **TasteAnchorsModal** — full-screen popup, 2-step chip-tap flow: pick up to 2 languages, then pick 3 artists from the union of those languages' curated pools. Both steps include an "Other" chip that reveals a text box for a custom language/artist name when the curated options don't fit; the typed value (not the word "Other") is what's stored. Writes `{languages, artists, updatedAt}` to `localStorage.tasteAnchors`. Used for the forced first-load onboarding, the contextual `TasteBanner` fallback, and the sidebar's "Preferences" trigger (all three open this same popup — there is no separate inline editor).
- **Sidebar** — nav + a collapsible, independently-scrollable "Your Library" panel: **Artists** (lists the user's taste-anchor artists, always shown) and a **Preferences** pill that opens `TasteAnchorsModal`.
- **VibePulse.jsx** — daily-cap check → `MoodCloud` (scattered layout; tapping a mood highlights it but only fires the query once the "Set" button inside the modal is clicked) → groq.js call (discovery mode, requests 16 candidates) → `Promise.all(itunes.searchByArtistTrack)` → first 10 resolved matches → `SuggestionList` (row layout, not cards) with thumbs shown only for the currently-loaded track. The global round `FloatingVibeButton` (bottom-right, visible on every tab) reopens the mood cloud, independent of daily cap. `NoNewSongsButton` (also always visible) skips the mood cloud entirely and fires a Groq call in familiar mode, favoring the user's real listening history over the static onboarding artist list. `tasteAnchors` is received as a prop from `App.jsx` (not read independently) so editing Preferences from the sidebar — without switching tabs — re-triggers the active mood query automatically. Dismissing the mood picker without ever picking a mood calls `onGoHome` instead of leaving this tab in its empty state. Accepts `autoOpenMoodPicker`/`onAutoOpenHandled`/`tasteAnchors`/`onGoHome` props so `App.jsx` can drive it.

## State management

- No Redux/Zustand. React Context only for the player (the one cross-cutting piece of state).
- `useLocalStorage(key, defaultValue)` hook backs `tasteAnchors`, `vibePulseFeedback`, `dailyVibePrompt`, `onboardingSeen`, `profileName` — all owned at the `AppShell` level (not re-read independently by child pages) so every consumer sees the same live value.
- `AppShell` also holds transient (non-persisted) component state for the onboarding chain: `isOnboardingFlow` (is the currently-open taste modal the forced first-load one, vs. banner/manual/Preferences) and `pendingMoodPicker` (one-shot signal telling `VibePulse` to auto-open its mood picker, also reused by the global floating vibe button).

## Data flow

```
App.jsx --(mount, if !onboardingSeen && !tasteAnchors, after a 1.5s delay)--> forces TasteAnchorsModal open

Home.jsx --(mount)--> itunes.js.searchTracks(seedQuery) x3 --> setState(tracks)
Home card click --> PlayerContext.play(track)

TasteAnchorsModal --(save, from onboarding/banner/sidebar Preferences)--> App.jsx setTasteAnchors(...)
   --> storage.js.set('tasteAnchors', {...}) + passed down as a live prop to VibePulse.jsx
   (if a vibe is already active) --> VibePulse re-runs the current mood query against the new anchors
   (first-load only) --> App.jsx navigates to Vibe Pulse + tells it to auto-open the mood picker

VibePulse: mood chip tap --> MoodCloud highlights it (no API call yet)
VibePulse: "Set" button tap, or tasteAnchors prop changing while a mood is active -->
   groq.js.getMoodRecommendations(tasteAnchors, mood) --> [{artist, track}] x16
   --> Promise.all(itunes.js.searchByArtistTrack(artist, track, {country})) --> filter + take first 10
   --> SuggestionList renders rows
VibePulse: mood picker dismissed with no mood ever picked --> onGoHome() --> App.jsx setActiveTab('home')

SuggestionList row click --> PlayerContext.play(track)  (same shared player as Home)
SuggestionList thumbs click --> storage.js.set('vibePulseFeedback', {...})  (isolated, never touches tasteAnchors)
```

Key integration point: Home's `TrackCard` and Vibe Pulse's `SuggestionList` rows both call the same
`PlayerContext.play(track)`. This is explicitly tested in Phase 5/6.

## iTunes Search API shape

```
GET https://itunes.apple.com/search?term=<encoded query>&media=music&limit=10[&country=XX]

Response.results[i] = {
  trackName, artistName, artworkUrl100, previewUrl, trackId, collectionName, ...
}
```

- `searchTracks(term, limit=10)` → normalized `{ id, trackName, artistName, artworkUrl, previewUrl }[]`, filters out results with no `previewUrl`.
- `searchByArtistTrack(artist, track, { country })` → fetches `limit=5` (not 1) and prefers a result whose artist name actually matches the requested one (diacritic/case-insensitive), falling back to the first candidate only if none match — avoids trusting iTunes's fuzzy top hit blindly. `country` (e.g. `"IN"`, derived from `tasteData.countryForLanguages`) biases the search toward a regional storefront, since the default US catalog has thin coverage for many regional-language tracks.

## Groq API shape

```
POST https://api.groq.com/openai/v1/chat/completions
Headers: { Authorization: `Bearer ${apiKey}`, Content-Type: application/json }
Body: {
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: "<system prompt, see VibePulse spec>" },
    { role: "user", content: JSON.stringify({ tasteAnchors, mood, recentlyPlayed }) }
  ],
  response_format: { type: "json_object" }
}
```

One LLM call per mood tap (daily prompt, floating vibe button, "no new songs", or a live preference
edit while a mood is active — all funnel through the same `runMoodQuery`), returning 16 track
recommendations in one response (over-requested so 10 reliably survive iTunes filtering — the
shown list is sliced to the first 10 resolved matches). Response parsed as
`JSON.parse(choices[0].message.content)` → `{ tracks: [{artist, track}, ...] }`, wrapped in
try/catch with a fallback (empty array + inline error state) on parse failure. `recentlyPlayed`
comes from `lib/listeningHistory.js` (most-recently-played tracks, capped at 20).

Two system prompts, selected by a `mode` param (`'discovery'` default, or `'familiar'`), both
stating the taste anchors are "hard constraints, not vague hints" (strengthened after a live-deploy
bug report of the LLM ignoring them):
- **discovery** — mix of well-known/lesser-known tracks fitting the mood, prioritizing the
  listener's preferred language(s).
- **familiar** — used by the "No new songs" button: explicitly asks for well-known, popular
  tracks specifically by the listener's chosen artists (or very similar ones), not discovery —
  the inverse framing, for comfort/repeat listening on demand. No mood word is required for this
  path; it bypasses the mood cloud entirely and fires immediately.

Note: the mood picker itself is two steps — tapping a mood chip only highlights it; the actual Groq
call fires when the user taps the "Set" button rendered inside the mood popup card itself (below
the mood chips), not on the chip tap itself. The popup's heading reads "What's your vibe now?" —
mood-setting isn't framed as a once-a-day action.

### Multi-key rotation

`apiKey` above comes from a small in-module rotator, not a single hardcoded env var. Reads
`VITE_GROQ_API_KEYS` (comma-separated, up to 5 keys — falls back to single `VITE_GROQ_API_KEY` if
that's what's set) and keeps a module-level "current key index". Each call tries the current key;
on a retryable failure (HTTP 401/403/429, or a network error) it advances to the next key and
retries, up to once per configured key, then throws if all are exhausted. It does not round-robin
on every call — it sticks with whichever key last succeeded, only rotating forward on failure.
This is purely a resilience measure (e.g. one key hitting Groq's free-tier rate limit) and does
not change the request/response shape above.

## localStorage schema

```js
// key: "tasteAnchors"
{ languages: string[1-2], artists: string[3], updatedAt: ISOString }

// key: "onboardingSeen" — whether the forced first-load taste popup has been
// shown/dismissed at least once (distinct from tasteAnchors itself, so a user
// who closes it without finishing doesn't get force-prompted every reload —
// the contextual banner is the fallback for that case instead)
boolean

// key: "vibePulseFeedback"  — isolated from tasteAnchors, never mutates it
{ "<artist>::<track>": "up" | "down", ... }

// key: "dailyVibePrompt"
{ lastShownDate: "YYYY-MM-DD", lastResponse: "picked" | "dismissed" | null }

// key: "tasteBannerDismissedAt"
{ dismissedAt: ISOString }

// key: "profileName" — cosmetic only, not real auth/identity
string  // e.g. "Guest" (default) or whatever the user typed via ProfileBadge
```

## Build order

1. Scaffold Vite + React + Tailwind, dark shell, sidebar + top bar + empty main area
2. Persistent bottom player wired to a hardcoded iTunes previewUrl
3. Home: real iTunes Search API tracks, click-to-play
4. Taste Anchors chip-tap flow + localStorage
5. Vibe Pulse tab: mood cloud → Groq → iTunes lookup → suggestion cards
6. Thumbs up/down + manual "change my vibe" button
7. ~~Debug Metrics panel~~ — built, then removed per user request (not a user-facing feature; see `docs/status.md`)
8. Visual polish
9. Deploy to Vercel

Each phase is built, run (`npm run dev`), and verified working — including integration points with
prior phases — before moving to the next. See `docs/status.md` for the running log.
