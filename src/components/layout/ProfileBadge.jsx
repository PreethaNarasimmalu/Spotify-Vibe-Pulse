import { useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../lib/storage'

// Lightweight local avatar — not real auth/accounts, just a cosmetic stand-in
// for the account avatar Spotify shows in its top bar. Matches Spotify's own
// top bar, which shows only a round initial avatar, no visible name text.
export default function ProfileBadge() {
  const [name, setName] = useLocalStorage(STORAGE_KEYS.PROFILE_NAME, 'P')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  const startEditing = () => {
    setDraft(name)
    setEditing(true)
  }

  const commit = () => {
    const trimmed = draft.trim()
    setName(trimmed || 'P')
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
        placeholder="Initial"
        className="bg-black/40 border border-spotify-green rounded-full px-3 py-1 text-white text-sm w-20 text-center focus:outline-none"
      />
    )
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'P'

  return (
    <button
      type="button"
      onClick={startEditing}
      data-testid="profile-badge"
      title="Click to change your avatar initial"
      className="w-8 h-8 rounded-full bg-spotify-green text-black text-sm font-bold flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
    >
      {initial}
    </button>
  )
}
