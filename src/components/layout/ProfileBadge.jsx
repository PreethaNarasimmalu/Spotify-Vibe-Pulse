import { useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../lib/storage'

// Lightweight local display name — not real auth/accounts, just a cosmetic
// stand-in for the profile name/avatar Spotify shows in its top bar.
export default function ProfileBadge() {
  const [name, setName] = useLocalStorage(STORAGE_KEYS.PROFILE_NAME, 'Guest')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  const startEditing = () => {
    setDraft(name)
    setEditing(true)
  }

  const commit = () => {
    const trimmed = draft.trim()
    setName(trimmed || 'Guest')
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        autoFocus
        data-testid="profile-name-input"
        className="bg-black/40 border border-spotify-green rounded-full px-3 py-1 text-white text-sm w-32 focus:outline-none"
      />
    )
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'G'

  return (
    <button
      type="button"
      onClick={startEditing}
      data-testid="profile-badge"
      title="Click to change your display name"
      className="flex items-center gap-2 bg-black/40 hover:bg-black/60 rounded-full pl-1 pr-3 py-1 cursor-pointer transition-colors"
    >
      <span className="w-6 h-6 rounded-full bg-spotify-green text-black text-xs font-bold flex items-center justify-center">
        {initial}
      </span>
      <span className="text-white text-sm font-medium">{name}</span>
    </button>
  )
}
