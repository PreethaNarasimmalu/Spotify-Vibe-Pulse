import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storage'
import { getMoodRecommendations } from '../api/groq'
import { searchByArtistTrack } from '../api/itunes'
import { countryForLanguages } from '../lib/tasteData'
import { getListeningHistory } from '../lib/listeningHistory'
import MoodCloud from '../components/vibePulse/MoodCloud'
import SuggestionList from '../components/vibePulse/SuggestionList'
import NoNewSongsButton from '../components/vibePulse/NoNewSongsButton'

const SUGGESTION_TARGET = 10

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function VibePulse({ autoOpenMoodPicker = false, onAutoOpenHandled, tasteAnchors, onGoHome }) {
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
      const tracks = await getMoodRecommendations(tasteAnchors, mood, queryMode, getListeningHistory())
      const country = countryForLanguages(tasteAnchors?.languages)
      const resolved = await Promise.all(
        tracks.map((t) => searchByArtistTrack(t.artist, t.track, { country })),
      )
      setSuggestions(resolved.filter(Boolean).slice(0, SUGGESTION_TARGET))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Preferences (languages/artists) can be edited from the sidebar or the
  // contextual banner without ever leaving this tab, so this tab's own state
  // wouldn't otherwise know they changed. Once a vibe is already active,
  // re-run the same mood/mode against the updated taste anchors automatically
  // instead of leaving the list showing recommendations grounded in the old
  // preferences. Skipped on mount so it doesn't double-fire the first query.
  const skipNextTasteRefresh = useRef(true)
  useEffect(() => {
    if (skipNextTasteRefresh.current) {
      skipNextTasteRefresh.current = false
      return
    }
    if (selectedMood) runMoodQuery(selectedMood, mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasteAnchors])

  const handleDailyMoodPick = (mood) => {
    setDailyPrompt({ lastShownDate: today, lastResponse: 'picked' })
    runMoodQuery(mood)
  }

  // Dismissing without ever having picked a mood this session would otherwise
  // leave the user staring at this tab's empty "no vibe set" state — send them
  // back to Home instead. Once a mood has actually been set (suggestions are
  // showing), dismissing a re-opened picker just closes it and keeps those
  // suggestions visible.
  const handleDailyDismiss = () => {
    setDailyPrompt({ lastShownDate: today, lastResponse: 'dismissed' })
    if (!selectedMood) onGoHome?.()
  }

  // If today's daily prompt hasn't been resolved yet, consuming the manual
  // (change-vibe / floating-button) picker also counts as resolving it — so
  // dismissing or picking here doesn't immediately reveal a second, separate
  // daily-prompt mood cloud stacked right behind it.
  const handleManualMoodPick = (mood) => {
    setManualPromptOpen(false)
    if (showDailyPrompt) setDailyPrompt({ lastShownDate: today, lastResponse: 'picked' })
    runMoodQuery(mood)
  }

  const handleManualDismiss = () => {
    setManualPromptOpen(false)
    if (showDailyPrompt) setDailyPrompt({ lastShownDate: today, lastResponse: 'dismissed' })
    if (!selectedMood) onGoHome?.()
  }

  // Reuses whatever vibe was last set (or a neutral default if none picked
  // yet this session) so "no new songs" stays relevant to the mood the user
  // is actually in, instead of ignoring it and giving generic favorites.
  const handleNoNewSongs = () => {
    runMoodQuery(selectedMood ?? 'chill', 'familiar')
  }

  const heading =
    mode === 'familiar' ? `Familiar favorites for your "${selectedMood}" mood` : `For your "${selectedMood}" mood`

  return (
    <div className="pt-4">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-white text-2xl font-bold">Vibe Pulse</h2>
        <NoNewSongsButton onClick={handleNoNewSongs} />
      </div>

      {manualPromptOpen && <MoodCloud onSelectMood={handleManualMoodPick} onDismiss={handleManualDismiss} />}

      {!manualPromptOpen && showDailyPrompt && !selectedMood && (
        <MoodCloud onSelectMood={handleDailyMoodPick} onDismiss={handleDailyDismiss} />
      )}

      {!manualPromptOpen && !showDailyPrompt && !selectedMood && (
        <p className="text-spotify-gray text-sm" data-testid="vibe-pulse-empty">
          Tap the round green button (bottom-right) anytime to get fresh suggestions — there's no
          daily limit on changing your mind.
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
