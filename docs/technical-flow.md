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
    │   └── storage.js            # localStorage keys + get/set helpers
    │
    ├── components/
    │   ├── layout/ (Sidebar, TopBar, MainLayout)
    │   ├── player/ (PlayerBar, ProgressBar)
    │   ├── cards/ (TrackCard — shared by Home + Vibe Pulse)
    │   ├── tasteAnchors/ (TasteAnchorsModal, ChipGroup, TasteBanner)
    │   └── vibePulse/ (MoodCloud, ChangeVibeButton, SuggestionGrid)
    │
    └── pages/
        ├── Home.jsx
        ├── VibePulse.jsx
        ├── Search.jsx            # minimal stub, nav item only
        └── Library.jsx           # minimal stub, nav item only
```

## Component responsibilities

- **App.jsx** — owns active tab state, renders MainLayout (Sidebar + TopBar + page + PlayerBar), wraps in PlayerContext.Provider.
- **PlayerContext** — single `<audio>` ref, survives tab switches. Exposes `{ currentTrack, isPlaying, play(track), togglePlay(), seek(), setVolume(), progress, duration }`. Track shape: `{ trackName, artistName, artworkUrl, previewUrl }`.
- **PlayerBar** — pure consumer of PlayerContext; artwork/name/artist, play/pause, skip, progress (drag-to-seek within 30s clip), volume.
- **Home.jsx** — on mount, fires 3 seed queries in parallel via itunes.js, renders sectioned card grids. Card click → `player.play(track)`.
- **TasteAnchorsModal** — 2-step chip-tap flow: pick 1 language, then pick 3 artists from a language-matched curated pool (the artist options shown depend on the language just picked). Writes `{language, artists, updatedAt}` to `localStorage.tasteAnchors`. `TasteBanner` shows contextually (after N plays, not on first load) and via a manual "Update your taste" entry point in settings.
- **VibePulse.jsx** — daily-cap check → MoodCloud (scattered layout) → on mood tap, groq.js call (discovery mode) → 6 `{artist, track}` → `Promise.all(itunes.searchByArtistTrack)` → SuggestionGrid of TrackCards with thumbs. `ChangeVibeButton` always visible, independent of daily cap, reopens the mood cloud. `NoNewSongsButton` (also always visible) skips the mood cloud entirely and fires a Groq call in familiar mode for comfort/repeat-listening picks by the user's chosen artists.

## State management

- No Redux/Zustand. React Context only for the player (the one cross-cutting piece of state).
- `useLocalStorage(key, defaultValue)` hook backs `tasteAnchors`, `vibePulseFeedback`, `dailyVibePrompt`.

## Data flow

```
Home.jsx --(mount)--> itunes.js.searchTracks(seedQuery) x3 --> setState(tracks)
Home card click --> PlayerContext.play(track)

TasteAnchorsModal --(submit)--> storage.js.set('tasteAnchors', {...})
   (read later by) --> VibePulse.jsx on mount / mood click

VibePulse mood click --> groq.js.getMoodRecommendations(tasteAnchors, mood)
   --> [{artist, track}] x6
   --> Promise.all(itunes.js.searchByArtistTrack) --> [{artist,track,artworkUrl,previewUrl}]
   --> SuggestionGrid renders TrackCards

SuggestionGrid card click --> PlayerContext.play(track)  (same shared player as Home)
SuggestionGrid thumbs click --> storage.js.set('vibePulseFeedback', {...})  (isolated, never touches tasteAnchors)
```

Key integration point: `TrackCard` is shared by Home and Vibe Pulse, so both call the same
`PlayerContext.play(track)`. This is explicitly tested in Phase 5.

## iTunes Search API shape

```
GET https://itunes.apple.com/search?term=<encoded query>&media=music&limit=10

Response.results[i] = {
  trackName, artistName, artworkUrl100, previewUrl, trackId, collectionName, ...
}
```

- `searchTracks(term, limit=10)` → normalized `{ id, trackName, artistName, artworkUrl, previewUrl }[]`, filters out results with no `previewUrl`.
- `searchByArtistTrack(artist, track)` → `term="${artist} ${track}"&limit=1`, returns first normalized result or `null`.

## Groq API shape

```
POST https://api.groq.com/openai/v1/chat/completions
Headers: { Authorization: `Bearer ${apiKey}`, Content-Type: application/json }
Body: {
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: "<system prompt, see VibePulse spec>" },
    { role: "user", content: JSON.stringify({ tasteAnchors, mood }) }
  ],
  response_format: { type: "json_object" }
}
```

Exactly 1 LLM call per mood tap (daily prompt, manual "change my vibe", or "no new songs" — same
code path), returning all 6 track recommendations in one response. Response parsed as
`JSON.parse(choices[0].message.content)` → `{ tracks: [{artist, track}, ...] }`, wrapped in
try/catch with a fallback (empty array + inline error state) on parse failure.

Two system prompts, selected by a `mode` param (`'discovery'` default, or `'familiar'`):
- **discovery** — the original prompt: mix of well-known/lesser-known tracks fitting the mood,
  prioritizing the listener's preferred language.
- **familiar** — used by the "No new songs" button: explicitly asks for well-known, popular
  tracks specifically by the listener's chosen artists (or very similar ones), not discovery —
  the inverse framing, for comfort/repeat listening on demand. No mood word is required for this
  path; it bypasses the mood cloud entirely and fires immediately.

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
{ language: string, artists: string[3], updatedAt: ISOString }

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
