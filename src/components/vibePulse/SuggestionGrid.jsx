import { usePlayer } from '../../context/PlayerContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../lib/storage'
import TrackCard from '../cards/TrackCard'

function feedbackKey(track) {
  return `${track.artistName}::${track.trackName}`
}

export default function SuggestionGrid({ tracks, heading }) {
  const { play, currentTrack, isPlaying } = usePlayer()
  // Isolated from tasteAnchors by design: Vibe Pulse thumbs feedback must never
  // silently alter the user's primary taste profile/recommendations.
  const [feedback, setFeedback] = useLocalStorage(STORAGE_KEYS.VIBE_PULSE_FEEDBACK, {})

  const setTrackFeedback = (track, value) => {
    const key = feedbackKey(track)
    setFeedback((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="mt-6" data-testid="suggestion-grid">
      <p className="text-spotify-gray text-xs uppercase font-bold tracking-wide mb-3">{heading}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={(t) => play(t, tracks)}
            isActive={currentTrack?.id === track.id && isPlaying}
            thumbs={{
              value: feedback[feedbackKey(track)],
              onUp: (t) => setTrackFeedback(t, 'up'),
              onDown: (t) => setTrackFeedback(t, 'down'),
            }}
          />
        ))}
      </div>
    </div>
  )
}
