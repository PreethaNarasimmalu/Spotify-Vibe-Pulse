import { useEffect, useState } from 'react'
import MainLayout from './components/layout/MainLayout'
import TasteBanner from './components/tasteAnchors/TasteBanner'
import TasteAnchorsModal from './components/tasteAnchors/TasteAnchorsModal'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import { STORAGE_KEYS } from './lib/storage'
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
  // One-shot signal telling VibePulse to auto-open its mood picker — set either
  // right after finishing first-load onboarding, or any time the global
  // floating "Set your vibe" button is tapped from anywhere in the app.
  const [pendingMoodPicker, setPendingMoodPicker] = useState(false)
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
  // Preferences opened later via the sidebar or the banner.
  const closeTasteModal = () => {
    setShowTasteModal(false)
    if (isOnboardingFlow) {
      setOnboardingSeen(true)
      setIsOnboardingFlow(false)
      setActiveTab('vibepulse')
      setPendingMoodPicker(true)
    }
  }

  const saveTasteAnchors = (anchors) => {
    setTasteAnchors(anchors)
    setShowTasteModal(false)
    setOnboardingSeen(true)
    if (isOnboardingFlow) {
      setIsOnboardingFlow(false)
      setActiveTab('vibepulse')
      setPendingMoodPicker(true)
    }
  }

  // The global floating button (visible on every tab) — always available,
  // never gated by the daily cap. Works from anywhere, not just the Vibe
  // Pulse tab itself.
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
      ? { autoOpenMoodPicker: pendingMoodPicker, onAutoOpenHandled: () => setPendingMoodPicker(false) }
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
