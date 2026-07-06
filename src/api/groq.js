const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

// Requesting more than the 10 we actually show gives the caller a buffer to
// absorb tracks that never resolve to a playable iTunes preview, so the
// displayed list stays at a full 10 instead of trailing off to whatever
// happened to survive the lookup.
const REQUEST_COUNT = 16

const DISCOVERY_SYSTEM_PROMPT =
  'You are a music recommendation engine for a Spotify-like app. The listener\'s taste anchors ' +
  '(1-2 preferred languages, favorite artists) are hard constraints, not vague hints: every track ' +
  'you return must either be BY one of the listed favorite artists, or by a different artist who ' +
  'sings in one of the listener\'s preferred languages and shares a similar genre/style. Given the ' +
  `listener's current mood word, return exactly ${REQUEST_COUNT} track recommendations that genuinely ` +
  'fit that mood, as strict JSON: {"tracks":[{"artist":"...","track":"..."}]}. No markdown, no preamble. ' +
  'Favor a mix of well-known and lesser-known tracks, not just top-40 picks — but never ignore the ' +
  'listener\'s languages or artists to do so. If a recentlyPlayed list is provided, avoid ' +
  'recommending tracks the listener has already been playing — this is meant to be discovery.'

// Used by the "No new songs" button — the inverse of the discovery prompt: the
// listener explicitly wants familiar comfort listening, not discovery.
const FAMILIAR_SYSTEM_PROMPT =
  'You are a music recommendation engine for a Spotify-like app. The listener\'s taste anchors ' +
  '(1-2 preferred languages, favorite artists) are hard constraints. The listener wants familiar ' +
  `comfort listening for their current mood, not discovery: return exactly ${REQUEST_COUNT} well-known, ` +
  'popular track recommendations that fit the mood, as strict JSON: {"tracks":[{"artist":"...","track":"..."}]}. ' +
  'No markdown, no preamble. If a recentlyPlayed list is provided (their actual recent listening ' +
  'history), heavily favor tracks by those same artists, or by the listener\'s originally chosen ' +
  'favorite artists — this reflects their real current taste better than a static onboarding list ' +
  'alone. Do not suggest obscure or new/undiscovered artists here — only artists the listener ' +
  'already listens to or extremely similar established names in the same languages.'

function loadApiKeys() {
  const multi = import.meta.env.VITE_GROQ_API_KEYS
  if (multi) {
    return multi.split(',').map((k) => k.trim()).filter(Boolean)
  }
  const single = import.meta.env.VITE_GROQ_API_KEY
  return single ? [single] : []
}

const apiKeys = loadApiKeys()
// Sticky index: stays on whichever key last worked, only rotates forward on failure.
let currentKeyIndex = 0

function isRetryableStatus(status) {
  return status === 401 || status === 403 || status === 429
}

export async function getMoodRecommendations(tasteAnchors, mood, mode = 'discovery', recentlyPlayed = []) {
  if (apiKeys.length === 0) {
    throw new Error('No Groq API key configured (set VITE_GROQ_API_KEY or VITE_GROQ_API_KEYS)')
  }

  const systemPrompt = mode === 'familiar' ? FAMILIAR_SYSTEM_PROMPT : DISCOVERY_SYSTEM_PROMPT
  let lastError = null

  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const key = apiKeys[currentKeyIndex]
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify({ tasteAnchors, mood, recentlyPlayed }) },
          ],
          response_format: { type: 'json_object' },
        }),
      })

      if (!res.ok) {
        if (isRetryableStatus(res.status) && apiKeys.length > 1) {
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length
          lastError = new Error(`Groq request failed: ${res.status}`)
          continue
        }
        throw new Error(`Groq request failed: ${res.status}`)
      }

      const data = await res.json()
      const parsed = JSON.parse(data.choices[0].message.content)
      return Array.isArray(parsed.tracks) ? parsed.tracks : []
    } catch (err) {
      lastError = err
      if (attempt < apiKeys.length - 1) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length
        continue
      }
    }
  }

  throw lastError ?? new Error('Groq request failed')
}
