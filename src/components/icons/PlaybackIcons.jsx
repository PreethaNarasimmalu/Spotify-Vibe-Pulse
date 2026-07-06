export function PlayIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z" />
    </svg>
  )
}

export function PauseIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M3 1.5h3v13H3v-13zM10 1.5h3v13h-3v-13z" />
    </svg>
  )
}

export function SkipPreviousIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.607v12.575a.7.7 0 0 1-1.05.606L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z" />
    </svg>
  )
}

export function SkipNextIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z" />
    </svg>
  )
}

export function VolumeIcon({ size = 16, muted = false }) {
  if (muted) {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
        <path d="M8.7.3a1 1 0 0 1 .55.9v13.6a1 1 0 0 1-1.7.7L3.6 11.5H1a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h2.6L7.55.1A1 1 0 0 1 8.7.3zM12.7 4.3a.75.75 0 0 1 1.06 0l1.19 1.19 1.19-1.19a.75.75 0 1 1 1.06 1.06L15.96 6.5l1.19 1.19a.75.75 0 1 1-1.06 1.06l-1.19-1.19-1.19 1.19a.75.75 0 1 1-1.06-1.06l1.19-1.19-1.19-1.19a.75.75 0 0 1 0-1.06z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M9.741.85a.8.8 0 0 1 .375.65v13a.8.8 0 0 1-1.375.55L4.825 11.5H1.8a.8.8 0 0 1-.8-.8v-5.4a.8.8 0 0 1 .8-.8h3.025L8.741.3a.8.8 0 0 1 1-.15zM12.25 8a3.25 3.25 0 0 0-1.264-2.577.75.75 0 1 0-.922 1.182 1.75 1.75 0 0 1 0 2.79.75.75 0 0 0 .922 1.182A3.25 3.25 0 0 0 12.25 8z" />
      <path d="M13.25 8a5.746 5.746 0 0 0-2.336-4.622.75.75 0 0 1 .894-1.204A7.246 7.246 0 0 1 14.75 8a7.246 7.246 0 0 1-2.942 5.826.75.75 0 1 1-.894-1.204A5.746 5.746 0 0 0 13.25 8z" />
    </svg>
  )
}
