export default function ChangeVibeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="change-vibe-button"
      title="Pick a new mood to get fresh suggestions"
      className="flex items-center gap-2 text-xs font-bold text-white bg-spotify-card hover:bg-spotify-card-hover px-4 py-2 rounded-full cursor-pointer transition-colors"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
      Change my vibe
    </button>
  )
}
