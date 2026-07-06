export default function FloatingVibeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="floating-vibe-button"
      title="Change your vibe — anytime, no limit"
      aria-label="Change your vibe"
      className="fixed bottom-28 right-6 z-40 w-14 h-14 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-transform"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    </button>
  )
}
