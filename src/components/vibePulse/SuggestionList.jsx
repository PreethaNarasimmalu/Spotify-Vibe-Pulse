import { usePlayer } from '../../context/PlayerContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../lib/storage'
import { PlayIcon, PauseIcon } from '../icons/PlaybackIcons'

function feedbackKey(track) {
  return `${track.artistName}::${track.trackName}`
}

export default function SuggestionList({ tracks, heading }) {
  const { play, currentTrack, isPlaying } = usePlayer()
  // Isolated from tasteAnchors by design: Vibe Pulse thumbs feedback must never
  // silently alter the user's primary taste profile/recommendations.
  const [feedback, setFeedback] = useLocalStorage(STORAGE_KEYS.VIBE_PULSE_FEEDBACK, {})

  const setTrackFeedback = (track, value) => {
    const key = feedbackKey(track)
    setFeedback((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="mt-6" data-testid="suggestion-list">
      <p className="text-spotify-gray text-xs uppercase font-bold tracking-wide mb-3">{heading}</p>
      <div className="flex flex-col">
        {tracks.map((track, index) => {
          const isActive = currentTrack?.id === track.id && isPlaying
          const trackFeedback = feedback[feedbackKey(track)]
          return (
            <div
              key={track.id}
              data-testid="suggestion-row"
              onClick={() => play(track, tracks)}
              className="group flex items-center gap-4 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
            >
              <span className="w-6 text-center text-spotify-gray text-sm shrink-0">
                {isActive ? (
                  <span className="text-spotify-green">
                    <PauseIcon size={14} />
                  </span>
                ) : (
                  <>
                    <span className="group-hover:hidden">{index + 1}</span>
                    <span className="hidden group-hover:inline">
                      <PlayIcon size={14} />
                    </span>
                  </>
                )}
              </span>

              <img src={track.artworkUrl} alt="" className="w-12 h-12 rounded shrink-0" />

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-spotify-green' : 'text-white'}`}>
                  {track.trackName}
                </p>
                <p className="text-spotify-gray text-xs truncate">{track.artistName}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setTrackFeedback(track, 'up')}
                  aria-label="Thumbs up"
                  className={`text-base cursor-pointer transition-transform hover:scale-110 ${trackFeedback === 'up' ? 'opacity-100' : 'opacity-40'}`}
                >
                  👍
                </button>
                <button
                  type="button"
                  onClick={() => setTrackFeedback(track, 'down')}
                  aria-label="Thumbs down"
                  className={`text-base cursor-pointer transition-transform hover:scale-110 ${trackFeedback === 'down' ? 'opacity-100' : 'opacity-40'}`}
                >
                  👎
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
