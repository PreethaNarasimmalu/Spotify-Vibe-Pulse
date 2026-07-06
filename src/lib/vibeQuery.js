import { getMoodRecommendations } from '../api/groq'
import { searchByArtistTrack } from '../api/itunes'
import { countryForLanguages } from './tasteData'

// Shown-list cap — shared by every call site (onboarding's inline Home
// recommendations and the full Vibe Pulse tab) so they never drift out of
// sync with each other.
export const SUGGESTION_TARGET = 10

export async function fetchVibeSuggestions(tasteAnchors, mood, mode, recentlyPlayed) {
  const tracks = await getMoodRecommendations(tasteAnchors, mood, mode, recentlyPlayed)
  const country = countryForLanguages(tasteAnchors?.languages)
  const resolved = await Promise.all(tracks.map((t) => searchByArtistTrack(t.artist, t.track, { country })))
  return resolved.filter(Boolean).slice(0, SUGGESTION_TARGET)
}
