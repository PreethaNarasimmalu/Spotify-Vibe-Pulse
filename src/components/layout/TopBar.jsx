const TAB_TITLES = {
  home: 'Home',
  search: 'Search',
  library: 'Your Library',
  vibepulse: 'Vibe Pulse',
}

export default function TopBar({ activeTab, onToggleDebugPanel }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-spotify-black/90 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Back"
          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer hover:bg-black/80"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Forward"
          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer hover:bg-black/80"
        >
          ›
        </button>
        <h1 className="text-white font-bold text-lg">{TAB_TITLES[activeTab] ?? ''}</h1>
      </div>

      <button
        type="button"
        onClick={onToggleDebugPanel}
        className="text-xs font-bold text-spotify-gray hover:text-white border border-[#535353] rounded-full px-3 py-1 transition-colors cursor-pointer"
      >
        Debug Metrics
      </button>
    </header>
  )
}
