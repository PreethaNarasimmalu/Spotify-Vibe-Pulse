const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'

function normalizeResult(result) {
  return {
    id: String(result.trackId),
    trackName: result.trackName,
    artistName: result.artistName,
    artworkUrl: result.artworkUrl100,
    previewUrl: result.previewUrl,
  }
}

// Loose match for comparing artist names across catalogs/transliterations —
// lowercase, strip diacritics and non-alphanumerics.
function normalizeForCompare(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export async function searchTracks(term, limit = 10) {
  const url = `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(term)}&media=music&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`)
  const data = await res.json()
  return data.results.filter((r) => r.previewUrl).map(normalizeResult)
}

// `country` (e.g. "IN") biases the search toward a regional iTunes storefront —
// the default US catalog has thin coverage for many regional-language tracks,
// which was causing missing/mismatched results for Tamil/Telugu/Malayalam picks.
export async function searchByArtistTrack(artist, track, { country } = {}) {
  const term = `${artist} ${track}`
  const params = new URLSearchParams({ term, media: 'music', limit: '5' })
  if (country) params.set('country', country)
  const url = `${ITUNES_SEARCH_URL}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`)
  const data = await res.json()
  const candidates = data.results.filter((r) => r.previewUrl)
  if (candidates.length === 0) return null

  // Prefer a result whose artist actually matches who we asked for, rather than
  // blindly trusting iTunes's top hit — its fuzzy search can surface an
  // unrelated track (e.g. a different language entirely) as result #1.
  const wantedArtist = normalizeForCompare(artist)
  const bestMatch = candidates.find((r) => {
    const gotArtist = normalizeForCompare(r.artistName)
    return gotArtist.includes(wantedArtist) || wantedArtist.includes(gotArtist)
  })
  return normalizeResult(bestMatch ?? candidates[0])
}
