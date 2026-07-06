import { useState } from 'react'
import ChipGroup from './ChipGroup'

export const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam']
const OTHER = 'Other'

// Curated per-language pools reflecting current (2026) trending/Gen-Z-relevant artists,
// not just generic all-time favorites — see docs/status.md for the research behind these.
export const ARTISTS_BY_LANGUAGE = {
  English: ['Drake', 'Taylor Swift', 'Bad Bunny', 'Bruno Mars', 'The Weeknd', 'Justin Bieber'],
  Tamil: ['Sai Abhyankkar', 'Anirudh Ravichander', 'Sid Sriram', 'A.R. Rahman', 'Ilaiyaraaja'],
  Hindi: ['Akasa', 'Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'Neha Kakkar', 'Sonu Nigam'],
  Telugu: ['Thaman S', 'Devi Sri Prasad', 'Sid Sriram', 'A.R. Rahman'],
  Malayalam: ['Sithara Krishnakumar', 'Vijay Yesudas', 'Haricharan', 'Sooraj Santhosh', 'Vineeth Sreenivasan'],
}

// Fallback pool when the listener types a custom ("Other") language we have no curated list for.
const DEFAULT_ARTIST_POOL = ['Drake', 'Taylor Swift', 'Bad Bunny', 'The Weeknd', 'Ed Sheeran', 'Dua Lipa']

// iTunes storefront to search for a given language — the default US catalog has
// thin coverage for regional-language tracks, so Indian languages route to the
// Indian storefront instead. Unmapped/custom languages fall through to no
// override (iTunes defaults to the US storefront).
export const COUNTRY_BY_LANGUAGE = {
  Tamil: 'IN',
  Hindi: 'IN',
  Telugu: 'IN',
  Malayalam: 'IN',
}

export default function TasteAnchorsModal({ onClose, onSave, initial }) {
  const [stepIndex, setStepIndex] = useState(0)
  const knownLanguage = initial?.language && LANGUAGES.includes(initial.language) ? initial.language : null
  const [language, setLanguage] = useState(knownLanguage)
  const [showCustomInput, setShowCustomInput] = useState(Boolean(initial?.language && !knownLanguage))
  const [customLanguage, setCustomLanguage] = useState(initial?.language && !knownLanguage ? initial.language : '')
  const [artists, setArtists] = useState(initial?.artists ?? [])

  const isLanguageStep = stepIndex === 0
  const isLastStep = stepIndex === 1
  const effectiveLanguage = showCustomInput ? customLanguage.trim() : language
  const artistOptions = showCustomInput
    ? DEFAULT_ARTIST_POOL
    : language
      ? (ARTISTS_BY_LANGUAGE[language] ?? DEFAULT_ARTIST_POOL)
      : []
  const isComplete = isLanguageStep ? Boolean(effectiveLanguage) : artists.length === 3

  const toggleLanguage = (option) => {
    setArtists([])
    if (option === OTHER) {
      setShowCustomInput(true)
      setLanguage(null)
      return
    }
    setShowCustomInput(false)
    setCustomLanguage('')
    setLanguage((prev) => (prev === option ? null : option))
  }

  const toggleArtist = (option) => {
    setArtists((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : prev.length < 3 ? [...prev, option] : prev,
    )
  }

  const handleNext = () => {
    if (!isComplete) return
    if (isLastStep) {
      onSave({ language: effectiveLanguage, artists, updatedAt: new Date().toISOString() })
    } else {
      setStepIndex(1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
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

        {isLanguageStep ? (
          <>
            <h2 className="text-white text-xl font-bold mb-4">Which language do you listen to most?</h2>
            <ChipGroup
              options={[...LANGUAGES, OTHER]}
              selected={showCustomInput ? [OTHER] : language ? [language] : []}
              max={1}
              onToggle={toggleLanguage}
            />
            {showCustomInput && (
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
            <h2 className="text-white text-xl font-bold mb-4">Pick 3 {effectiveLanguage} artists you like</h2>
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
