import { usePlayer } from '../../context/PlayerContext'
import TrackCard from '../cards/TrackCard'

export default function SuggestionGrid({ tracks, mood }) {
  const { play, currentTrack, isPlaying } = usePlayer()

  return (
    <div className="mt-6" data-testid="suggestion-grid">
      <p className="text-spotify-gray text-xs uppercase font-bold tracking-wide mb-3">
        For your "{mood}" mood
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={(t) => play(t, tracks)}
            isActive={currentTrack?.id === track.id && isPlaying}
          />
        ))}
      </div>
    </div>
  )
}
