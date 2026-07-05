export default function TrackCard({ track, onPlay, isActive, thumbs }) {
  return (
    <div
      className="group bg-spotify-card hover:bg-spotify-card-hover rounded-md p-4 transition-colors cursor-pointer"
      onClick={() => onPlay(track)}
      data-testid="track-card"
    >
      <div className="relative mb-4">
        <img src={track.artworkUrl} alt="" className="w-full aspect-square object-cover rounded shadow-lg" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPlay(track)
          }}
          aria-label={isActive ? 'Pause' : 'Play'}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center text-black opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-lg"
        >
          {isActive ? '⏸' : '▶'}
        </button>
      </div>
      <p className="text-white text-sm font-medium truncate">{track.trackName}</p>
      <p className="text-spotify-gray text-xs truncate mt-1">{track.artistName}</p>

      {thumbs && (
        <div className="flex items-center gap-3 mt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => thumbs.onUp(track)}
            aria-label="Thumbs up"
            className={`text-lg cursor-pointer transition-transform hover:scale-110 ${thumbs.value === 'up' ? 'opacity-100' : 'opacity-50'}`}
          >
            👍
          </button>
          <button
            type="button"
            onClick={() => thumbs.onDown(track)}
            aria-label="Thumbs down"
            className={`text-lg cursor-pointer transition-transform hover:scale-110 ${thumbs.value === 'down' ? 'opacity-100' : 'opacity-50'}`}
          >
            👎
          </button>
        </div>
      )}
    </div>
  )
}
