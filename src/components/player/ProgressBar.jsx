function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ProgressBar({ progress, duration, onSeek }) {
  const pct = duration > 0 ? (progress / duration) * 100 : 0

  const handleClick = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    onSeek(Math.max(0, Math.min(1, ratio)) * duration)
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <span className="text-xs text-spotify-gray w-10 text-right tabular-nums">{formatTime(progress)}</span>
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={progress}
        className="relative flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group"
        onClick={handleClick}
      >
        <div
          className="absolute top-0 left-0 h-1 bg-white group-hover:bg-spotify-green rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-spotify-gray w-10 tabular-nums">{formatTime(duration)}</span>
    </div>
  )
}
