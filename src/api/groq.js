const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT =
  'You are a music recommendation engine. Given a listener\'s taste anchors (styles, artists, ' +
  'music directors, singer) and their current mood word, return exactly 6 track recommendations ' +
  'as strict JSON: {"tracks":[{"artist":"...","track":"..."}]}. No markdown, no preamble. Favor a ' +
  'mix of well-known and lesser-known tracks that genuinely fit the mood and taste, not just ' +
  'top-40 picks.'

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

export async function getMoodRecommendations(tasteAnchors, mood) {
  if (apiKeys.length === 0) {
    throw new Error('No Groq API key configured (set VITE_GROQ_API_KEY or VITE_GROQ_API_KEYS)')
  }

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
            { role: 'system', content: SYSTEM_PROMPT },
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
