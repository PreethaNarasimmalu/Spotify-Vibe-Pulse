export default function TasteBanner({ onOpen, onDismiss }) {
  return (
    <div
      className="flex items-center justify-between gap-4 bg-spotify-card border border-spotify-green/40 rounded-lg px-4 py-3 mb-6"
      data-testid="taste-banner"
    >
      <p className="text-white text-sm">
        Help <span className="text-spotify-green font-bold">Vibe Pulse</span> learn your taste — takes 20 seconds
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpen}
          className="bg-spotify-green text-black text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer hover:scale-105 transition-transform"
        >
          Let's go
        </button>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-spotify-gray hover:text-white cursor-pointer">
          ✕
        </button>
      </div>
    </div>
  )
}
