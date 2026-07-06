import { VolumeIcon } from '../icons/PlaybackIcons'

export default function VolumeSlider({ volume, onChange }) {
  const pct = volume * 100

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    onChange(Math.max(0, Math.min(1, ratio)))
  }

  return (
    <div className="flex items-center gap-2 w-32">
      <span className="text-spotify-gray">
        <VolumeIcon muted={volume === 0} />
      </span>
      <div
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group"
        onClick={handleClick}
      >
        <div
          className="absolute top-0 left-0 h-1 bg-white group-hover:bg-spotify-green rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  )
}
