import { readStorage, writeStorage, STORAGE_KEYS } from './storage'

const DEFAULT_METRICS = {
  suggestionsShown: 0,
  suggestionsRated: 0,
  vibeButtonTaps: 0,
  dailyPromptsShown: 0,
  dailyPromptsPicked: 0,
  sessionArtistsIntroduced: [],
  sessionArtistReplays: 0,
  totalListeningSeconds: 0,
}

const METRICS_UPDATED_EVENT = 'vibepulse-metrics-updated'

function readMetrics() {
  return readStorage(STORAGE_KEYS.VIBE_PULSE_METRICS, DEFAULT_METRICS)
}

function updateMetrics(updater) {
  const next = updater(readMetrics())
  writeStorage(STORAGE_KEYS.VIBE_PULSE_METRICS, next)
  window.dispatchEvent(new CustomEvent(METRICS_UPDATED_EVENT))
  return next
}

export function getMetrics() {
  return readMetrics()
}

export function onMetricsUpdated(handler) {
  window.addEventListener(METRICS_UPDATED_EVENT, handler)
  return () => window.removeEventListener(METRICS_UPDATED_EVENT, handler)
}

export function recordSuggestionsShown(count) {
  const next = updateMetrics((m) => ({ ...m, suggestionsShown: m.suggestionsShown + count }))
  console.log('[metrics] suggestionsShown +%d ->', count, next.suggestionsShown)
}

export function recordThumbsFeedback() {
  const next = updateMetrics((m) => ({ ...m, suggestionsRated: m.suggestionsRated + 1 }))
  console.log('[metrics] suggestionsRated +1 ->', next.suggestionsRated)
}

export function recordVibeButtonTap() {
  const next = updateMetrics((m) => ({ ...m, vibeButtonTaps: m.vibeButtonTaps + 1 }))
  console.log('[metrics] vibeButtonTaps +1 ->', next.vibeButtonTaps)
}

export function recordDailyVibeResponse(response) {
  const next = updateMetrics((m) => ({
    ...m,
    dailyPromptsShown: m.dailyPromptsShown + 1,
    dailyPromptsPicked: m.dailyPromptsPicked + (response === 'picked' ? 1 : 0),
  }))
  console.log('[metrics] dailyVibeResponse:', response, '-> shown', next.dailyPromptsShown, 'picked', next.dailyPromptsPicked)
}

// Approximates returnToArtistRate client-side within a single session (no
// multi-day backend here): an artist counts as "introduced" the first time a
// track of theirs plays from a Vibe Pulse suggestion; any later play of that
// same artist (from anywhere) counts as a return.
export function recordArtistPlay(artistName, source) {
  if (!artistName) return
  const next = updateMetrics((m) => {
    if (m.sessionArtistsIntroduced.includes(artistName)) {
      return { ...m, sessionArtistReplays: m.sessionArtistReplays + 1 }
    }
    if (source === 'vibepulse') {
      return { ...m, sessionArtistsIntroduced: [...m.sessionArtistsIntroduced, artistName] }
    }
    return m
  })
  console.log('[metrics] artistPlay:', artistName, `(${source})`, '-> introduced', next.sessionArtistsIntroduced.length, 'replays', next.sessionArtistReplays)
}

// Guardrail metric — this should never trend down after Vibe Pulse ships.
export function recordListeningTime(seconds) {
  const next = updateMetrics((m) => ({ ...m, totalListeningSeconds: m.totalListeningSeconds + seconds }))
  console.log('[metrics] totalListeningSeconds +%ds ->', seconds, next.totalListeningSeconds)
}

export function computeDerivedMetrics(m) {
  return {
    thumbsRate: m.suggestionsShown > 0 ? (m.suggestionsRated / m.suggestionsShown) * 100 : 0,
    vibeButtonTaps: m.vibeButtonTaps,
    dailyVibeTapParticipation: m.dailyPromptsShown > 0 ? (m.dailyPromptsPicked / m.dailyPromptsShown) * 100 : 0,
    returnToArtistRate:
      m.sessionArtistsIntroduced.length > 0
        ? (m.sessionArtistReplays / m.sessionArtistsIntroduced.length) * 100
        : 0,
    avgWeeklyListeningTimeSeconds: m.totalListeningSeconds,
  }
}
