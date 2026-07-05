export const STORAGE_KEYS = {
  TASTE_ANCHORS: 'tasteAnchors',
  VIBE_PULSE_FEEDBACK: 'vibePulseFeedback',
  DAILY_VIBE_PROMPT: 'dailyVibePrompt',
  VIBE_PULSE_METRICS: 'vibePulseMetrics',
  TASTE_BANNER_DISMISSED: 'tasteBannerDismissedAt',
}

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
