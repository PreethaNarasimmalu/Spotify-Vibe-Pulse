import { useState } from 'react'
import ChipGroup from './ChipGroup'

const STEPS = [
  {
    key: 'styles',
    label: 'Pick 3 music styles',
    max: 3,
    options: [
      'Pop', 'Hip-Hop', 'R&B', 'Rock', 'Indie', 'Electronic', 'K-Pop', 'Jazz',
      'Country', 'Latin', 'Afrobeats', 'Lo-fi', 'Classical', 'Metal', 'Reggae',
    ],
  },
  {
    key: 'artists',
    label: 'Pick 3 artists',
    max: 3,
    options: [
      'Taylor Swift', 'Drake', 'The Weeknd', 'Billie Eilish', 'Bad Bunny',
      'Kendrick Lamar', 'Dua Lipa', 'Ed Sheeran', 'Beyoncé', 'SZA',
      'Travis Scott', 'Olivia Rodrigo', 'Arijit Singh', 'BTS', 'Coldplay',
    ],
  },
  {
    key: 'directors',
    label: 'Pick 2 music directors / composers',
    max: 2,
    options: [
      'Hans Zimmer', 'A.R. Rahman', 'John Williams', 'Pritam',
      'Ludwig Göransson', 'Ilaiyaraaja', 'Danny Elfman', 'Max Richter',
    ],
  },
  {
    key: 'singer',
    label: 'Pick 1 singer',
    max: 1,
    options: [
      'Arijit Singh', 'Adele', 'Frank Ocean', 'Whitney Houston',
      'Sam Smith', 'Rihanna', 'Shreya Ghoshal', 'John Legend',
    ],
  },
]

export default function TasteAnchorsModal({ onClose, onSave, initial }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(() => ({
    styles: initial?.styles ?? [],
    artists: initial?.artists ?? [],
    directors: initial?.directors ?? [],
    singer: initial?.singer ?? [],
  }))

  const step = STEPS[stepIndex]
  const currentSelection = answers[step.key]
  const isComplete = currentSelection.length === step.max
  const isLastStep = stepIndex === STEPS.length - 1

  const toggleOption = (option) => {
    setAnswers((prev) => {
      const current = prev[step.key]
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : current.length < step.max
          ? [...current, option]
          : current
      return { ...prev, [step.key]: next }
    })
  }

  const handleNext = () => {
    if (!isComplete) return
    if (isLastStep) {
      onSave({ ...answers, updatedAt: new Date().toISOString() })
    } else {
      setStepIndex((i) => i + 1)
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
          <p className="text-spotify-gray text-xs font-bold uppercase tracking-wide">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-spotify-gray hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
        <h2 className="text-white text-xl font-bold mb-4">{step.label}</h2>
        <ChipGroup options={step.options} selected={currentSelection} max={step.max} onToggle={toggleOption} />

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
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
