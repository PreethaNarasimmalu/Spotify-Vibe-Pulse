import { useEffect, useState } from 'react'
import MainLayout from './components/layout/MainLayout'
import TasteBanner from './components/tasteAnchors/TasteBanner'
import TasteAnchorsModal from './components/tasteAnchors/TasteAnchorsModal'
import MoodCloud from './components/vibePulse/MoodCloud'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import { STORAGE_KEYS } from './lib/storage'
import { fetchVibeSuggestions } from './lib/vibeQuery'
import { getListeningHistory } from './lib/listeningHistory'
import { todayString } from './lib/date'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import VibePulse from './pages/VibePulse'

const PAGES = {
  home: Home,
  search: Search,
  library: Library,
  vibepulse: VibePulse,
}

// Plays-before-prompt threshold for the contextual "Update your taste" banner —
// the fallback path if someone closes the first-load onboarding popup without
// finishing it. In production this would also re-trigger on a rolling ~90-day
// basis or after an engagement milestone, not on a fixed calendar push —
// tracked via tasteAnchors.updatedAt, not implemented here since this
// prototype has no real multi-session backend to measure against.
const PLAYS_BEFORE_TASTE_BANNER = 3

function AppShell() {
  const [activeTab, setActiveTab] = useState('home')
  const [tasteAnchors, setTasteAnchors] = useLocalStorage(STORAGE_KEYS.TASTE_ANCHORS, null)
  const [onboardingSeen, setOnboardingSeen] = useLocalStorage(STORAGE_KEYS.ONBOARDING_SEEN, false)
  const [showTasteModal, setShowTasteModal] = useState(false)
  const [isOnboardingFlow, setIsOnboardingFlow] = useState(false)
  // One-shot signal telling VibePulse to auto-open its mood picker — set any
  // time the global floating "Set your vibe" button is tapped from anywhere
  // in the app (an explicit request to go manage the vibe, unlike onboarding
  // below, which shows results inline instead of navigating there).
  const [pendingMoodPicker, setPendingMoodPicker] = useState(false)
  // The onboarding flow's mood popup lives here, not inside VibePulse, so
  // picking a mood right after first-load preferences shows results inline on
  // Home instead of forcing a tab switch — the user only lands on the Vibe
  // Pulse tab if they explicitly choose to (sidebar nav or the floating
  // button), never as a side effect of just setting preferences.
  const [showOnboardingMoodPopup, setShowOnboardingMoodPopup] = useState(false)
  const [onboardingVibe, setOnboardingVibe] = useState({ mood: null, suggestions: [], loading: false, error: null })
  const [dailyPrompt, setDailyPrompt] = useLocalStorage(STORAGE_KEYS.DAILY_VIBE_PROMPT, {
    lastShownDate: null,
    lastResponse: null,
  })
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const { currentTrack } = usePlayer()

  useEffect(() => {
    if (currentTrack) setPlayCount((c) => c + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id])

  // Forced first-load onboarding: only fires once ever, tracked by
  // onboardingSeen — separate from tasteAnchors itself so closing without
  // finishing doesn't get force-prompted again on every reload. Waits ~1.5s
  // after mount rather than appearing instantly, so it doesn't feel like a
  // jarring interstitial before the app has even rendered anything.
  useEffect(() => {
    if (onboardingSeen || tasteAnchors) return
    const timer = setTimeout(() => {
      setShowTasteModal(true)
      setIsOnboardingFlow(true)
    }, 1500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Page = PAGES[activeTab]
  const showBanner = !tasteAnchors && !bannerDismissed && playCount >= PLAYS_BEFORE_TASTE_BANNER

  // Closing the first-load preferences popup without finishing it still
  // chains into the vibe popup next, same as saving does — the two-popup
  // sequence (preferences, then vibe) always runs to completion the first
  // time, regardless of whether the user filled in preferences or just
  // dismissed it. Only applies to this one-shot onboarding flow, never to
  // Preferences opened later via the sidebar or the banner. Neither branch
  // switches tabs — setting preferences alone should never force a jump to
  // the Vibe Pulse tab; the mood popup that follows renders wherever the
  // user already is (in practice, still Home).
  const closeTasteModal = () => {
    setShowTasteModal(false)
    if (isOnboardingFlow) {
      setOnboardingSeen(true)
      setIsOnboardingFlow(false)
      setShowOnboardingMoodPopup(true)
    }
  }

  const saveTasteAnchors = (anchors) => {
    setTasteAnchors(anchors)
    setShowTasteModal(false)
    setOnboardingSeen(true)
    if (isOnboardingFlow) {
      setIsOnboardingFlow(false)
      setShowOnboardingMoodPopup(true)
    }
  }

  // Result of the onboarding-only mood popup: shown inline on Home via the
  // `vibe` prop, never by switching to the Vibe Pulse tab. Also resolves
  // today's daily prompt so Vibe Pulse doesn't immediately re-ask for a mood
  // the moment the user does happen to visit it later the same day.
  const handleOnboardingMoodPick = async (mood) => {
    setShowOnboardingMoodPopup(false)
    setDailyPrompt({ lastShownDate: todayString(), lastResponse: 'picked' })
    setOnboardingVibe({ mood, suggestions: [], loading: true, error: null })
    try {
      const suggestions = await fetchVibeSuggestions(tasteAnchors, mood, 'discovery', getListeningHistory())
      setOnboardingVibe({ mood, suggestions, loading: false, error: null })
    } catch (err) {
      setOnboardingVibe({ mood, suggestions: [], loading: false, error: err.message })
    }
  }

  const handleOnboardingMoodDismiss = () => {
    setShowOnboardingMoodPopup(false)
    setDailyPrompt({ lastShownDate: todayString(), lastResponse: 'dismissed' })
  }

  // The global floating button (visible on every tab) — always available,
  // never gated by the daily cap. This is the explicit "go manage my vibe"
  // action, so — unlike onboarding — it does deliberately switch to the Vibe
  // Pulse tab.
  const openVibePicker = () => {
    setActiveTab('vibepulse')
    setPendingMoodPicker(true)
  }

  // Sidebar's "Preferences" tab — always opens the same popup modal (not an
  // inline editor), same as the banner's entry point.
  const openPreferences = () => {
    setIsOnboardingFlow(false)
    setShowTasteModal(true)
  }

  const pageProps =
    activeTab === 'vibepulse'
      ? {
          autoOpenMoodPicker: pendingMoodPicker,
          onAutoOpenHandled: () => setPendingMoodPicker(false),
          tasteAnchors,
          onGoHome: () => setActiveTab('home'),
        }
      : activeTab === 'home'
        ? { vibe: onboardingVibe }
        : {}

  return (
    <MainLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      tasteAnchors={tasteAnchors}
      onOpenPreferences={openPreferences}
      onOpenVibePicker={openVibePicker}
    >
      {showBanner && (
        <TasteBanner
          onOpen={() => {
            setIsOnboardingFlow(false)
            setShowTasteModal(true)
          }}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
      <Page {...pageProps} />

      {showTasteModal && <TasteAnchorsModal initial={tasteAnchors} onClose={closeTasteModal} onSave={saveTasteAnchors} />}
      {showOnboardingMoodPopup && (
        <MoodCloud onSelectMood={handleOnboardingMoodPick} onDismiss={handleOnboardingMoodDismiss} />
      )}
    </MainLayout>
  )
}

function App() {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  )
}

export default App
