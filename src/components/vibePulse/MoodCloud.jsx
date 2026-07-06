import { useState } from 'react'

const MOODS = ['chill', 'hyped', 'focused', 'heartbroken', 'nostalgic', 'romantic', 'energetic', 'melancholy']

function pseudoRandom(seed) {
  const x = Math.sin(seed * 999) * 10000
  return x - Math.floor(x)
}

export default function MoodCloud({ onSelectMood, onDismiss, dismissible = true }) {
  const [selected, setSelected] = useState(null)

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={dismissible ? onDismiss : undefined}
    >
      <div
        className="relative bg-spotify-card rounded-xl px-6 py-8 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
        data-testid="mood-cloud"
      >
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            data-testid="mood-cloud-dismiss"
            className="absolute top-3 right-3 text-spotify-gray hover:text-white cursor-pointer"
          >
            ✕
          </button>
        )}
        <p className="text-white text-lg font-bold mb-6 text-center">What's your vibe today?</p>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4">
          {MOODS.map((mood, i) => {
            const rotate = (pseudoRandom(i + 1) - 0.5) * 16
            const translateY = (pseudoRandom(i + 50) - 0.5) * 24
            const sizeClass = i % 3 === 0 ? 'text-2xl' : i % 3 === 1 ? 'text-lg' : 'text-xl'
            const isSelected = selected === mood
            return (
              <button
                key={mood}
                type="button"
                data-testid="mood-chip"
                data-selected={isSelected}
                onClick={() => setSelected(mood)}
                style={{ transform: `rotate(${rotate}deg) translateY(${translateY}px)` }}
                className={`${sizeClass} font-bold px-5 py-2 rounded-full transition-colors cursor-pointer ${
                  isSelected ? 'bg-spotify-green text-black' : 'bg-black/40 hover:bg-spotify-green hover:text-black text-white'
                }`}
              >
                {mood}
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelectMood(selected)
          }}
          data-testid="set-vibe-button"
          className="fixed bottom-28 right-6 bg-spotify-green text-black font-bold px-8 py-3 rounded-full shadow-2xl cursor-pointer hover:scale-105 transition-transform z-50"
        >
          Set
        </button>
      )}
    </div>
  )
}
