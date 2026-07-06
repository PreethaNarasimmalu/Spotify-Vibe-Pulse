export default function NoNewSongsButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="no-new-songs-button"
      title="Give me familiar tracks, not discovery"
      className="flex items-center gap-2 text-xs font-bold text-white bg-spotify-card hover:bg-spotify-card-hover px-4 py-2 rounded-full cursor-pointer transition-colors"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
      No new songs
    </button>
  )
}
