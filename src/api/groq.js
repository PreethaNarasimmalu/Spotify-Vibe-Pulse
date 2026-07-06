const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const DISCOVERY_SYSTEM_PROMPT =
  'You are a music recommendation engine for a Spotify-like app. The listener\'s taste anchors ' +
  '(preferred language, favorite artists) are hard constraints, not vague hints: every track you ' +
  'return must either be BY one of the listed favorite artists, or by a different artist who sings ' +
  'in the listener\'s preferred language and shares a similar genre/style. Given the listener\'s ' +
  'current mood word, return exactly 10 track recommendations that genuinely fit that mood, as ' +
  'strict JSON: {"tracks":[{"artist":"...","track":"..."}]}. No markdown, no preamble. Favor a mix ' +
  'of well-known and lesser-known tracks, not just top-40 picks — but never ignore the listener\'s ' +
  'language or artists to do so.'

// Used by the "No new songs" button — the inverse of the discovery prompt: the
// listener explicitly wants familiar comfort listening, not discovery.
const FAMILIAR_SYSTEM_PROMPT =
  'You are a music recommendation engine for a Spotify-like app. The listener\'s taste anchors ' +
  '(preferred language, favorite artists) are hard constraints. The listener wants familiar ' +
  'comfort listening, not discovery: return exactly 10 well-known, popular track recommendations ' +
  'specifically BY the artists they listed, in their preferred language, as strict JSON: ' +
  '{"tracks":[{"artist":"...","track":"..."}]}. No markdown, no preamble. Do not suggest obscure ' +
  'or new artists — only the listener\'s own chosen artists, or extremely similar established ' +
  'names in the same language.'

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

export async function getMoodRecommendations(tasteAnchors, mood, mode = 'discovery') {
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
            { role: 'user', content: JSON.stringify({ tasteAnchors, mood }) },
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
