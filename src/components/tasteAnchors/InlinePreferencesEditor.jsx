import { useState } from 'react'
import ChipGroup from './ChipGroup'
import { LANGUAGES, OTHER_LANGUAGE, MAX_LANGUAGES, artistPoolForLanguages } from '../../lib/tasteData'

// Compact anytime editor embedded in the sidebar's Preferences tab — same data
// as TasteAnchorsModal, but no step wizard, since this is a quick tweak, not
// first-run onboarding.
export default function InlinePreferencesEditor({ tasteAnchors, onSave }) {
  const initialLanguages = tasteAnchors?.languages ?? []
  const initialKnown = initialLanguages.filter((l) => LANGUAGES.includes(l))
  const initialCustom = initialLanguages.find((l) => !LANGUAGES.includes(l)) ?? ''

  const [selectedChips, setSelectedChips] = useState(() =>
    initialCustom ? [...initialKnown, OTHER_LANGUAGE] : initialKnown,
  )
  const [customLanguage, setCustomLanguage] = useState(initialCustom)
  const [artists, setArtists] = useState(tasteAnchors?.artists ?? [])
  const [saved, setSaved] = useState(false)

  const hasOther = selectedChips.includes(OTHER_LANGUAGE)
  const effectiveLanguages = selectedChips
    .map((c) => (c === OTHER_LANGUAGE ? customLanguage.trim() : c))
    .filter(Boolean)
  const artistOptions = artistPoolForLanguages(effectiveLanguages)
  const isComplete = effectiveLanguages.length > 0 && artists.length === 3

  const toggleLanguageChip = (option) => {
    setArtists([])
    setSaved(false)
    setSelectedChips((prev) => {
      if (prev.includes(option)) {
        if (option === OTHER_LANGUAGE) setCustomLanguage('')
        return prev.filter((o) => o !== option)
      }
      if (prev.length >= MAX_LANGUAGES) return prev
      return [...prev, option]
    })
  }

  const toggleArtist = (option) => {
    setSaved(false)
    setArtists((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : prev.length < 3 ? [...prev, option] : prev,
    )
  }

  const handleSave = () => {
    if (!isComplete) return
    onSave({ languages: effectiveLanguages, artists, updatedAt: new Date().toISOString() })
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-4 p-3" data-testid="inline-preferences-editor">
      <div>
        <p className="text-spotify-gray text-xs font-bold uppercase tracking-wide mb-2">Language (up to 2)</p>
        <ChipGroup
          options={[...LANGUAGES, OTHER_LANGUAGE]}
          selected={selectedChips}
          max={MAX_LANGUAGES}
          onToggle={toggleLanguageChip}
        />
        {hasOther && (
          <input
            type="text"
            value={customLanguage}
            onChange={(e) => {
              setCustomLanguage(e.target.value)
              setSaved(false)
            }}
            placeholder="Type your language"
            data-testid="custom-language-input"
            className="mt-3 w-full bg-black/40 border border-[#535353] rounded-lg px-3 py-1.5 text-white text-xs placeholder-spotify-gray focus:outline-none focus:border-spotify-green"
          />
        )}
      </div>

      <div>
        <p className="text-spotify-gray text-xs font-bold uppercase tracking-wide mb-2">Pick 3 artists</p>
        <ChipGroup options={artistOptions} selected={artists} max={3} onToggle={toggleArtist} />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!isComplete}
        data-testid="inline-preferences-save"
        className="bg-spotify-green text-black font-bold px-4 py-2 rounded-full text-xs disabled:opacity-30 disabled:cursor-default cursor-pointer hover:scale-105 transition-transform self-start"
      >
        {saved ? 'Saved ✓' : 'Save preferences'}
      </button>
    </div>
  )
}
