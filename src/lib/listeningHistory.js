import { readStorage, writeStorage, STORAGE_KEYS } from './storage'

const MAX_HISTORY = 20

// Real listening history (most-recent-first), used to ground "No new songs"
// (and lightly, discovery) recommendations in what the listener actually
// plays, not just their static onboarding-time taste anchors.
export function recordPlayed(track) {
  if (!track?.artistName || !track?.trackName) return
  const entry = { artist: track.artistName, track: track.trackName }
  const history = readStorage(STORAGE_KEYS.LISTENING_HISTORY, [])
  const deduped = history.filter((h) => !(h.artist === entry.artist && h.track === entry.track))
  writeStorage(STORAGE_KEYS.LISTENING_HISTORY, [entry, ...deduped].slice(0, MAX_HISTORY))
}

export function getListeningHistory() {
  return readStorage(STORAGE_KEYS.LISTENING_HISTORY, [])
}
