import { useState } from 'react'
import ChipGroup from './ChipGroup'

export const LANGUAGES = ['English', 'Hindi', 'Punjabi', 'Tamil', 'Telugu', 'Korean']

// Curated per-language pools reflecting current (2026) trending/Gen-Z-relevant artists,
// not just generic all-time favorites — see docs/status.md for the research behind these.
export const ARTISTS_BY_LANGUAGE = {
  English: ['Drake', 'Taylor Swift', 'Bad Bunny', 'Bruno Mars', 'The Weeknd', 'Justin Bieber'],
  Hindi: ['Akasa', 'Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'Neha Kakkar', 'Sonu Nigam'],
  Punjabi: ['AP Dhillon', 'Diljit Dosanjh', 'Sidhu Moose Wala', 'Karan Aujla'],
  Tamil: ['Anirudh Ravichander', 'Sid Sriram', 'A.R. Rahman', 'Ilaiyaraaja'],
  Telugu: ['Sid Sriram', 'Thaman S', 'Devi Sri Prasad', 'A.R. Rahman'],
  Korean: ['BTS', 'BLACKPINK', 'NewJeans', 'Stray Kids'],
}

export default function TasteAnchorsModal({ onClose, onSave, initial }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [language, setLanguage] = useState(initial?.language ?? null)
  const [artists, setArtists] = useState(initial?.artists ?? [])

  const isLanguageStep = stepIndex === 0
  const isLastStep = stepIndex === 1
  const artistOptions = language ? ARTISTS_BY_LANGUAGE[language] : []
  const isComplete = isLanguageStep ? Boolean(language) : artists.length === 3

  const toggleLanguage = (option) => {
    setLanguage((prev) => (prev === option ? null : option))
    setArtists([])
  }

  const toggleArtist = (option) => {
    setArtists((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : prev.length < 3 ? [...prev, option] : prev,
    )
  }

  const handleNext = () => {
    if (!isComplete) return
    if (isLastStep) {
      onSave({ language, artists, updatedAt: new Date().toISOString() })
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
            <ChipGroup options={LANGUAGES} selected={language ? [language] : []} max={1} onToggle={toggleLanguage} />
          </>
        ) : (
          <>
            <h2 className="text-white text-xl font-bold mb-4">Pick 3 artists you like</h2>
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
