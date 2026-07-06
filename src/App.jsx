import { useEffect, useState } from 'react'
import MainLayout from './components/layout/MainLayout'
import TasteBanner from './components/tasteAnchors/TasteBanner'
import TasteAnchorsModal from './components/tasteAnchors/TasteAnchorsModal'
import DebugMetricsPanel from './components/debug/DebugMetricsPanel'
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

// Plays-before-prompt threshold for the contextual "Update your taste" banner.
// In production this banner (and the modal it opens) would also re-trigger on
// a rolling ~90-day basis or after an engagement milestone, not on a fixed
// calendar push — tracked via tasteAnchors.updatedAt, not implemented here
// since this prototype has no real multi-session backend to measure against.
const PLAYS_BEFORE_TASTE_BANNER = 3

function AppShell() {
  const [activeTab, setActiveTab] = useState('home')
  const [tasteAnchors, setTasteAnchors] = useLocalStorage(STORAGE_KEYS.TASTE_ANCHORS, null)
  const [showTasteModal, setShowTasteModal] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const { currentTrack } = usePlayer()

  useEffect(() => {
    if (currentTrack) setPlayCount((c) => c + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id])

  const Page = PAGES[activeTab]
  const showBanner = !tasteAnchors && !bannerDismissed && playCount >= PLAYS_BEFORE_TASTE_BANNER

  return (
    <MainLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenTasteAnchors={() => setShowTasteModal(true)}
      onToggleDebugPanel={() => setShowDebugPanel((v) => !v)}
    >
      {showBanner && (
        <TasteBanner onOpen={() => setShowTasteModal(true)} onDismiss={() => setBannerDismissed(true)} />
      )}
      <Page />

      {showDebugPanel && <DebugMetricsPanel onClose={() => setShowDebugPanel(false)} />}

      {showTasteModal && (
        <TasteAnchorsModal
          initial={tasteAnchors}
          onClose={() => setShowTasteModal(false)}
          onSave={(anchors) => {
            setTasteAnchors(anchors)
            setShowTasteModal(false)
          }}
        />
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
