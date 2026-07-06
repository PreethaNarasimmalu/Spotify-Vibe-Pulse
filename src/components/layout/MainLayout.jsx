import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Footer from './Footer'
import PlayerBar from '../player/PlayerBar'

export default function MainLayout({ activeTab, onSelectTab, tasteAnchors, onSaveTasteAnchors, children }) {
  return (
    <div className="h-screen flex flex-col bg-spotify-black">
      <div className="flex flex-1 min-h-0 gap-2 p-2 pb-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          tasteAnchors={tasteAnchors}
          onSaveTasteAnchors={onSaveTasteAnchors}
        />
        <main className="flex-1 min-w-0 rounded-lg bg-gradient-to-b from-[#1f1f1f] to-spotify-black overflow-y-auto">
          <TopBar activeTab={activeTab} onSelectTab={onSelectTab} />
          <div className="px-8 pb-8">
            {children}
            <Footer />
          </div>
        </main>
      </div>
      <PlayerBar />
    </div>
  )
}
