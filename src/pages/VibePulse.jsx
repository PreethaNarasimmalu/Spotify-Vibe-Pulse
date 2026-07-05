import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storage'
import { getMoodRecommendations } from '../api/groq'
import { searchByArtistTrack } from '../api/itunes'
import MoodCloud from '../components/vibePulse/MoodCloud'
import SuggestionGrid from '../components/vibePulse/SuggestionGrid'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function VibePulse() {
  const [tasteAnchors] = useLocalStorage(STORAGE_KEYS.TASTE_ANCHORS, null)
  const [dailyPrompt, setDailyPrompt] = useLocalStorage(STORAGE_KEYS.DAILY_VIBE_PROMPT, {
    lastShownDate: null,
    lastResponse: null,
  })
  const [selectedMood, setSelectedMood] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const today = todayString()
  const showDailyPrompt = dailyPrompt.lastShownDate !== today

  const runMoodQuery = async (mood) => {
    setSelectedMood(mood)
    setLoading(true)
    setError(null)
    setSuggestions([])
    try {
      const tracks = await getMoodRecommendations(tasteAnchors, mood)
      const resolved = await Promise.all(tracks.map((t) => searchByArtistTrack(t.artist, t.track)))
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

  return (
    <div className="pt-4">
      <h2 className="text-white text-2xl font-bold mb-6">Vibe Pulse</h2>

      {showDailyPrompt && !selectedMood && (
        <MoodCloud onSelectMood={handleDailyMoodPick} onDismiss={handleDailyDismiss} />
      )}

      {!showDailyPrompt && !selectedMood && (
        <p className="text-spotify-gray text-sm" data-testid="vibe-pulse-empty">
          You've already picked today's vibe. Come back tomorrow — manual re-rolling arrives with
          the "change my vibe" button in the next phase.
        </p>
      )}

      {loading && (
        <p className="text-spotify-gray text-sm mt-4" data-testid="vibe-pulse-loading">
          Finding tracks for "{selectedMood}"…
        </p>
      )}
      {error && (
        <p className="text-red-400 text-sm mt-4" data-testid="vibe-pulse-error">
          Couldn't get suggestions: {error}
        </p>
      )}

      {suggestions.length > 0 && <SuggestionGrid tracks={suggestions} mood={selectedMood} />}
    </div>
  )
}
