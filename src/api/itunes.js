const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'

function normalizeResult(result, source) {
  return {
    id: String(result.trackId),
    trackName: result.trackName,
    artistName: result.artistName,
    artworkUrl: result.artworkUrl100,
    previewUrl: result.previewUrl,
    // Tags where this track came from (e.g. 'home' vs 'vibepulse') so
    // PlayerContext can attribute plays correctly for the returnToArtistRate metric.
    source,
  }
}

export async function searchTracks(term, limit = 10, source = 'home') {
  const url = `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(term)}&media=music&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`)
  const data = await res.json()
  return data.results.filter((r) => r.previewUrl).map((r) => normalizeResult(r, source))
}

export async function searchByArtistTrack(artist, track, source = 'vibepulse') {
  const term = `${artist} ${track}`
  const url = `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(term)}&media=music&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`)
  const data = await res.json()
  const result = data.results.find((r) => r.previewUrl)
  return result ? normalizeResult(result, source) : null
}
