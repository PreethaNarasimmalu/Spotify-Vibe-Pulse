import { useState } from 'react'
import ChipGroup from './ChipGroup'
import { LANGUAGES, OTHER_LANGUAGE, MAX_LANGUAGES, artistPoolForLanguages } from '../../lib/tasteData'

export default function TasteAnchorsModal({ onClose, onSave, initial }) {
  const [stepIndex, setStepIndex] = useState(0)
  const initialLanguages = initial?.languages ?? []
  const initialKnown = initialLanguages.filter((l) => LANGUAGES.includes(l))
  const initialCustom = initialLanguages.find((l) => !LANGUAGES.includes(l)) ?? ''

  const [selectedChips, setSelectedChips] = useState(() =>
    initialCustom ? [...initialKnown, OTHER_LANGUAGE] : initialKnown,
  )
  const [customLanguage, setCustomLanguage] = useState(initialCustom)
  const [artists, setArtists] = useState(initial?.artists ?? [])

  const isLanguageStep = stepIndex === 0
  const isLastStep = stepIndex === 1
  const hasOther = selectedChips.includes(OTHER_LANGUAGE)
  const effectiveLanguages = selectedChips
    .map((c) => (c === OTHER_LANGUAGE ? customLanguage.trim() : c))
    .filter(Boolean)
  const artistOptions = artistPoolForLanguages(effectiveLanguages)
  const isComplete = isLanguageStep ? effectiveLanguages.length > 0 : artists.length === 3

  const toggleLanguageChip = (option) => {
    setArtists([])
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
    setArtists((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : prev.length < 3 ? [...prev, option] : prev,
    )
  }

  const handleNext = () => {
    if (!isComplete) return
    if (isLastStep) {
      onSave({ languages: effectiveLanguages, artists, updatedAt: new Date().toISOString() })
    } else {
      setStepIndex(1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-spotify-card rounded-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="taste-anchors-modal"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-spotify-gray text-xs font-bold uppercase tracking-wide">Step {stepIndex + 1} of 2</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-spotify-gray hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <h1 className="text-white text-2xl font-bold mb-4">Choose your favorites</h1>

        {isLanguageStep ? (
          <>
            <h2 className="text-white text-sm text-spotify-gray mb-4">Which language(s) do you listen to most? (up to 2)</h2>
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
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder="Type your language"
                data-testid="custom-language-input"
                autoFocus
                className="mt-4 w-full bg-black/40 border border-[#535353] rounded-lg px-4 py-2 text-white text-sm placeholder-spotify-gray focus:outline-none focus:border-spotify-green"
              />
            )}
          </>
        ) : (
          <>
            <h2 className="text-white text-sm text-spotify-gray mb-4">Pick 3 artists you like</h2>
            <ChipGroup options={artistOptions} selected={artists} max={3} onToggle={toggleArtist} />
          </>
        )}

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStepIndex(0)}
            disabled={stepIndex === 0}
            className="text-spotify-gray hover:text-white disabled:opacity-30 disabled:cursor-default text-sm font-bold cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!isComplete}
            data-testid="taste-anchors-next"
            className="bg-spotify-green text-black font-bold px-6 py-2 rounded-full text-sm disabled:opacity-30 disabled:cursor-default cursor-pointer hover:scale-105 transition-transform"
          >
            {isLastStep ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
