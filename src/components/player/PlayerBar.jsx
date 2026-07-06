import { usePlayer } from '../../context/PlayerContext'
import ProgressBar from './ProgressBar'
import VolumeSlider from './VolumeSlider'
import { PlayIcon, PauseIcon, SkipPreviousIcon, SkipNextIcon } from '../icons/PlaybackIcons'

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    skipNext,
    skipPrevious,
    hasNext,
    hasPrevious,
  } = usePlayer()

  return (
    <footer className="h-[90px] shrink-0 bg-black border-t border-[#282828] flex items-center px-4 gap-4" data-testid="player-bar">
      <div className="flex items-center gap-3 w-64 min-w-0">
        {currentTrack ? (
          <>
            <img src={currentTrack.artworkUrl} alt="" className="w-14 h-14 rounded" />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentTrack.trackName}</p>
              <p className="text-spotify-gray text-xs truncate">{currentTrack.artistName}</p>
            </div>
          </>
        ) : (
          <span className="text-spotify-gray text-xs">Pick a track to start listening</span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={skipPrevious}
            disabled={!hasPrevious}
            aria-label="Previous"
            className="text-spotify-gray hover:text-white disabled:opacity-30 disabled:cursor-default cursor-pointer"
          >
            <SkipPreviousIcon />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            data-testid="play-pause-button"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black cursor-pointer hover:scale-105 transition-transform disabled:opacity-40"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={skipNext}
            disabled={!hasNext}
            aria-label="Next"
            className="text-spotify-gray hover:text-white disabled:opacity-30 disabled:cursor-default cursor-pointer"
          >
            <SkipNextIcon />
          </button>
        </div>
        <ProgressBar progress={progress} duration={duration} onSeek={seek} />
      </div>

      <div className="w-64 flex items-center justify-end">
        <VolumeSlider volume={volume} onChange={setVolume} />
      </div>
    </footer>
  )
}
