export const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam']
export const OTHER_LANGUAGE = 'Other'
export const MAX_LANGUAGES = 2

// Curated per-language pools reflecting current (2026) trending/Gen-Z-relevant artists,
// not just generic all-time favorites — see docs/status.md for the research behind these.
export const ARTISTS_BY_LANGUAGE = {
  English: ['Drake', 'Taylor Swift', 'Bad Bunny', 'Bruno Mars', 'The Weeknd', 'Justin Bieber'],
  Tamil: ['Sai Abhyankkar', 'Anirudh Ravichander', 'Sid Sriram', 'A.R. Rahman', 'Ilaiyaraaja'],
  Hindi: ['Akasa', 'Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'Neha Kakkar', 'Sonu Nigam'],
  Telugu: ['Thaman S', 'Devi Sri Prasad', 'Sid Sriram', 'A.R. Rahman'],
  Malayalam: ['Sithara Krishnakumar', 'Vijay Yesudas', 'Haricharan', 'Sooraj Santhosh', 'Vineeth Sreenivasan'],
}

// Fallback pool when the listener types a custom ("Other") language we have no curated list for.
export const DEFAULT_ARTIST_POOL = ['Drake', 'Taylor Swift', 'Bad Bunny', 'The Weeknd', 'Ed Sheeran', 'Dua Lipa']

// iTunes storefront to search for a given language — the default US catalog has
// thin coverage for regional-language tracks, so Indian languages route to the
// Indian storefront instead. Unmapped/custom languages fall through to no
// override (iTunes defaults to the US storefront).
export const COUNTRY_BY_LANGUAGE = {
  Tamil: 'IN',
  Hindi: 'IN',
  Telugu: 'IN',
  Malayalam: 'IN',
}

// Union of artist pools across up to MAX_LANGUAGES selected languages, deduped.
export function artistPoolForLanguages(languages) {
  const pools = languages.map((lang) => ARTISTS_BY_LANGUAGE[lang] ?? DEFAULT_ARTIST_POOL)
  const merged = pools.length > 0 ? pools.flat() : []
  return [...new Set(merged)]
}

// If any selected language maps to a specific storefront, use it (first match wins).
export function countryForLanguages(languages = []) {
  for (const lang of languages) {
    if (COUNTRY_BY_LANGUAGE[lang]) return COUNTRY_BY_LANGUAGE[lang]
  }
  return undefined
}
