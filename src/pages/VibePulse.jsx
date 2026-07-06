import { useEffect, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storage'
import { getMoodRecommendations } from '../api/groq'
import { searchByArtistTrack } from '../api/itunes'
import { countryForLanguages } from '../lib/tasteData'
import MoodCloud from '../components/vibePulse/MoodCloud'
import SuggestionList from '../components/vibePulse/SuggestionList'
import ChangeVibeButton from '../components/vibePulse/ChangeVibeButton'
import NoNewSongsButton from '../components/vibePulse/NoNewSongsButton'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function VibePulse({ autoOpenMoodPicker = false, onAutoOpenHandled }) {
  const [tasteAnchors] = useLocalStorage(STORAGE_KEYS.TASTE_ANCHORS, null)
  const [dailyPrompt, setDailyPrompt] = useLocalStorage(STORAGE_KEYS.DAILY_VIBE_PROMPT, {
    lastShownDate: null,
    lastResponse: null,
  })
  const [manualPromptOpen, setManualPromptOpen] = useState(false)
  const [selectedMood, setSelectedMood] = useState(null)
  const [mode, setMode] = useState('discovery')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const today = todayString()
  const showDailyPrompt = dailyPrompt.lastShownDate !== today

  useEffect(() => {
    if (autoOpenMoodPicker) {
      setManualPromptOpen(true)
      onAutoOpenHandled?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenMoodPicker])

  const runMoodQuery = async (mood, queryMode = 'discovery') => {
    setSelectedMood(mood)
    setMode(queryMode)
    setLoading(true)
    setError(null)
    setSuggestions([])
    try {
      const tracks = await getMoodRecommendations(tasteAnchors, mood, queryMode)
      const country = countryForLanguages(tasteAnchors?.languages)
      const resolved = await Promise.all(
        tracks.map((t) => searchByArtistTrack(t.artist, t.track, { country })),
      )
      setSuggestions(resolved.filter(Boolean))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDailyMoodPick = (mood) => {
    setDailyPrompt({ lastShownDate: today, lastResponse: 'picked' })
    runMoodQuery(mood)
  }

  const handleDailyDismiss = () => {
    setDailyPrompt({ lastShownDate: today, lastResponse: 'dismissed' })
  }

  const handleManualMoodPick = (mood) => {
    setManualPromptOpen(false)
    runMoodQuery(mood)
  }

  const handleNoNewSongs = () => {
    runMoodQuery('familiar', 'familiar')
  }

  const heading = mode === 'familiar' ? 'Your familiar favorites' : `For your "${selectedMood}" mood`

  return (
    <div className="pt-4">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-white text-2xl font-bold">Vibe Pulse</h2>
        <ChangeVibeButton onClick={() => setManualPromptOpen(true)} />
        <NoNewSongsButton onClick={handleNoNewSongs} />
      </div>

      {manualPromptOpen && (
        <MoodCloud onSelectMood={handleManualMoodPick} onDismiss={() => setManualPromptOpen(false)} />
      )}

      {!manualPromptOpen && showDailyPrompt && !selectedMood && (
        <MoodCloud onSelectMood={handleDailyMoodPick} onDismiss={handleDailyDismiss} />
      )}

      {!manualPromptOpen && !showDailyPrompt && !selectedMood && (
        <p className="text-spotify-gray text-sm" data-testid="vibe-pulse-empty">
          You've already picked today's vibe. Come back tomorrow, tap the shuffle icon to change
          your vibe, or tap "No new songs" for familiar favorites right now.
        </p>
      )}

      {loading && (
        <p className="text-spotify-gray text-sm mt-4" data-testid="vibe-pulse-loading">
          Finding tracks…
        </p>
      )}
      {error && (
        <p className="text-red-400 text-sm mt-4" data-testid="vibe-pulse-error">
          Couldn't get suggestions: {error}
        </p>
      )}

      {suggestions.length > 0 && <SuggestionList tracks={suggestions} heading={heading} />}
    </div>
  )
}
