export default function FloatingVibeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="floating-vibe-button"
      title="Set your vibe — anytime, no limit"
      className="fixed bottom-28 left-6 z-40 flex items-center gap-2 bg-spotify-green text-black font-bold px-5 py-3 rounded-full shadow-2xl cursor-pointer hover:scale-105 transition-transform"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
      Set your vibe
    </button>
  )
}
