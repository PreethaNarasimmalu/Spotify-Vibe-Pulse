export default function ChangeVibeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="change-vibe-button"
      aria-label="Change my vibe"
      title="Change my vibe"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-spotify-card hover:bg-spotify-card-hover text-white cursor-pointer transition-colors hover:rotate-90 duration-300"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    </button>
  )
}
