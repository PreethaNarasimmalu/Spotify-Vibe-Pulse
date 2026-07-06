import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storage'
import { getMoodRecommendations } from '../api/groq'
import { searchByArtistTrack } from '../api/itunes'
import { recordDailyVibeResponse, recordVibeButtonTap, recordSuggestionsShown } from '../lib/metrics'
import MoodCloud from '../components/vibePulse/MoodCloud'
import SuggestionGrid from '../components/vibePulse/SuggestionGrid'
import ChangeVibeButton from '../components/vibePulse/ChangeVibeButton'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function VibePulse() {
  const [tasteAnchors] = useLocalStorage(STORAGE_KEYS.TASTE_ANCHORS, null)
  const [dailyPrompt, setDailyPrompt] = useLocalStorage(STORAGE_KEYS.DAILY_VIBE_PROMPT, {
    lastShownDate: null,
    lastResponse: null,
  })
  const [manualPromptOpen, setManualPromptOpen] = useState(false)
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
      const found = resolved.filter(Boolean)
      setSuggestions(found)
      recordSuggestionsShown(found.length)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDailyMoodPick = (mood) => {
    setDailyPrompt({ lastShownDate: today, lastResponse: 'picked' })
    recordDailyVibeResponse('picked')
    runMoodQuery(mood)
  }

  const handleDailyDismiss = () => {
    setDailyPrompt({ lastShownDate: today, lastResponse: 'dismissed' })
    recordDailyVibeResponse('dismissed')
  }

  const handleManualMoodPick = (mood) => {
    setManualPromptOpen(false)
    runMoodQuery(mood)
  }

  const handleChangeVibeClick = () => {
    recordVibeButtonTap()
    setManualPromptOpen(true)
  }

  return (
    <div className="pt-4">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-white text-2xl font-bold">Vibe Pulse</h2>
        <ChangeVibeButton onClick={handleChangeVibeClick} />
      </div>

      {manualPromptOpen && (
        <MoodCloud onSelectMood={handleManualMoodPick} onDismiss={() => setManualPromptOpen(false)} />
      )}

      {!manualPromptOpen && showDailyPrompt && !selectedMood && (
        <MoodCloud onSelectMood={handleDailyMoodPick} onDismiss={handleDailyDismiss} />
      )}

      {!manualPromptOpen && !showDailyPrompt && !selectedMood && (
        <p className="text-spotify-gray text-sm" data-testid="vibe-pulse-empty">
          You've already picked today's vibe. Come back tomorrow, or tap the shuffle icon above to
          change your vibe right now.
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
