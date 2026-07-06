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
  const [justCompletedOnboarding, setJustCompletedOnboarding] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const { currentTrack } = usePlayer()

  useEffect(() => {
    if (currentTrack) setPlayCount((c) => c + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id])

  // Forced first-load onboarding: only fires once, tracked by onboardingSeen —
  // separate from tasteAnchors itself so a user who closes without finishing
  // doesn't get force-prompted again on every reload (the contextual banner
  // below is the fallback for that case instead).
  useEffect(() => {
    if (!onboardingSeen && !tasteAnchors) {
      setShowTasteModal(true)
      setIsOnboardingFlow(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Page = PAGES[activeTab]
  const showBanner = !tasteAnchors && !bannerDismissed && playCount >= PLAYS_BEFORE_TASTE_BANNER

  const closeTasteModal = () => {
    setShowTasteModal(false)
    if (isOnboardingFlow) {
      setOnboardingSeen(true)
      setIsOnboardingFlow(false)
    }
  }

  const saveTasteAnchors = (anchors) => {
    setTasteAnchors(anchors)
    setShowTasteModal(false)
    setOnboardingSeen(true)
    if (isOnboardingFlow) {
      setIsOnboardingFlow(false)
      setActiveTab('vibepulse')
      setJustCompletedOnboarding(true)
    }
  }

  const pageProps =
    activeTab === 'vibepulse'
      ? { autoOpenMoodPicker: justCompletedOnboarding, onAutoOpenHandled: () => setJustCompletedOnboarding(false) }
      : {}

  return (
    <MainLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      tasteAnchors={tasteAnchors}
      onSaveTasteAnchors={saveTasteAnchors}
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
