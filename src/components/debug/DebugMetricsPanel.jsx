import { useEffect, useState } from 'react'
import { getMetrics, computeDerivedMetrics, onMetricsUpdated } from '../../lib/metrics'

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}m ${s}s`
}

export default function DebugMetricsPanel({ onClose }) {
  const [metrics, setMetrics] = useState(getMetrics())

  useEffect(() => onMetricsUpdated(() => setMetrics(getMetrics())), [])

  const derived = computeDerivedMetrics(metrics)

  const rows = [
    {
      label: 'Thumbs rate',
      value: `${derived.thumbsRate.toFixed(0)}%`,
      hint: `${metrics.suggestionsRated}/${metrics.suggestionsShown} suggestions rated`,
    },
    {
      label: 'Change-my-vibe taps',
      value: metrics.vibeButtonTaps,
    },
    {
      label: 'Daily vibe participation',
      value: `${derived.dailyVibeTapParticipation.toFixed(0)}%`,
      hint: `${metrics.dailyPromptsPicked}/${metrics.dailyPromptsShown} picked vs dismissed`,
    },
    {
      label: 'Return-to-artist rate (session)',
      value: `${derived.returnToArtistRate.toFixed(0)}%`,
      hint: `${metrics.sessionArtistReplays} replays / ${metrics.sessionArtistsIntroduced.length} introduced`,
    },
    {
      label: 'Avg weekly listening time',
      value: formatDuration(derived.avgWeeklyListeningTimeSeconds),
      hint: 'Guardrail — should never trend down after Vibe Pulse ships',
    },
  ]

  return (
    <div
      className="fixed bottom-[106px] right-4 w-80 bg-spotify-card border border-[#333] rounded-lg shadow-2xl p-4 z-40"
      data-testid="debug-metrics-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">Debug Metrics</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close debug metrics"
          className="text-spotify-gray hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} data-testid="metric-row">
            <div className="flex items-center justify-between">
              <span className="text-spotify-gray text-xs">{row.label}</span>
              <span className="text-white text-sm font-bold">{row.value}</span>
            </div>
            {row.hint && <span className="text-[10px] text-spotify-gray/70">{row.hint}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
