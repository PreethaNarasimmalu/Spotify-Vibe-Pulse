import { useState } from 'react'
import ProfileBadge from './ProfileBadge'

function HomeButton({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Home"
      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
        active ? 'bg-white text-black' : 'bg-black/60 text-spotify-gray hover:text-white'
      }`}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33Z" />
      </svg>
    </button>
  )
}

export default function TopBar({ activeTab, onSelectTab }) {
  const [query, setQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onSelectTab('search')
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 bg-spotify-black/90 backdrop-blur-md">
      <div className="flex items-center gap-3 min-w-0">
        <HomeButton active={activeTab === 'home'} onClick={() => onSelectTab('home')} />
        <form onSubmit={handleSearchSubmit} className="relative">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="#000"
            strokeWidth="2.5"
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to play?"
            data-testid="topbar-search-input"
            className="w-72 max-w-[40vw] bg-white text-black text-sm placeholder-[#6a6a6a] rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </form>
      </div>

      <ProfileBadge />
    </header>
  )
}
