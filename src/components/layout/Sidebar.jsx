const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'search', label: 'Search', icon: SearchIcon },
  { id: 'library', label: 'Your Library', icon: LibraryIcon },
  { id: 'vibepulse', label: 'Vibe Pulse', icon: PulseIcon },
]

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? '#fff' : '#b3b3b3'}>
      <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33Z" />
    </svg>
  )
}

function SearchIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={active ? '#fff' : '#b3b3b3'} strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function LibraryIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? '#fff' : '#b3b3b3'}>
      <rect x="3" y="3" width="6" height="18" rx="1" />
      <rect x="11" y="3" width="6" height="18" rx="1" />
      <rect x="19" y="3" width="2" height="18" rx="1" />
    </svg>
  )
}

function PulseIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={active ? '#1ed760' : '#b3b3b3'} strokeWidth="2">
      <path d="M3 12h4l2-7 4 14 2-7h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Sidebar({ activeTab, onSelectTab, onOpenTasteAnchors }) {
  return (
    <aside className="w-60 shrink-0 h-full bg-black flex flex-col gap-2 p-2">
      <div className="bg-spotify-card rounded-lg p-4">
        <div className="flex items-center gap-2 px-1 mb-4">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#1ed760">
            <circle cx="12" cy="12" r="12" />
            <path
              d="M17.9 10.9c-3.2-1.9-8.5-2.1-11.6-1.2-.5.1-1-.2-1.1-.6-.1-.5.2-1 .6-1.1 3.6-1 9.4-.8 13.1 1.4.4.2.6.8.3 1.2-.2.3-.8.5-1.3.3Zm-.1 3c-.2.3-.6.5-1 .3-2.7-1.6-6.8-2.1-10-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.6-1.1 8.1-.6 11.2 1.3.3.2.4.7.3 1Zm-1.1 2.9c-.2.3-.5.4-.8.2-2.3-1.4-5.3-1.7-8.7-.9-.3.1-.7-.1-.8-.5-.1-.3.1-.7.5-.8 3.8-.9 7.1-.5 9.7 1.1.3.2.4.6.1.9Z"
              fill="#000"
            />
          </svg>
          <span className="text-white font-bold text-xl tracking-tight">Spotify</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTab(id)}
                className={`flex items-center gap-4 px-2 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${
                  active ? 'text-white' : 'text-spotify-gray hover:text-white'
                }`}
              >
                <Icon active={active} />
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="bg-spotify-card rounded-lg p-4 flex-1 flex flex-col">
        <button
          type="button"
          onClick={onOpenTasteAnchors}
          className="text-left text-sm font-bold text-spotify-gray hover:text-white transition-colors cursor-pointer"
        >
          Update your taste
        </button>
      </div>
    </aside>
  )
}
