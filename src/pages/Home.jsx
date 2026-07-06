import { useEffect, useState } from 'react'
import { searchTracks } from '../api/itunes'
import { usePlayer } from '../context/PlayerContext'
import TrackCard from '../components/cards/TrackCard'
import SuggestionList from '../components/vibePulse/SuggestionList'

const SEED_SECTIONS = [
  { title: 'Top Hits 2026', query: 'top hits 2026' },
  { title: 'Chill Pop', query: 'chill pop' },
  { title: 'Hip Hop Hits', query: 'hip hop hits' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home({ vibe }) {
  const { play, currentTrack, isPlaying } = usePlayer()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadSections() {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.all(SEED_SECTIONS.map((s) => searchTracks(s.query)))
        if (cancelled) return
        setSections(SEED_SECTIONS.map((s, i) => ({ ...s, tracks: results[i] })))
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSections()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="pt-4">
        <p className="text-spotify-gray text-sm">Loading tracks…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-4">
        <p className="text-red-400 text-sm">Couldn't load tracks: {error}</p>
      </div>
    )
  }

  return (
    <div className="pt-4 flex flex-col gap-8">
      <h1 className="text-white text-3xl font-bold -mb-2">{getGreeting()}</h1>

      {vibe?.loading && (
        <p className="text-spotify-gray text-sm" data-testid="home-vibe-loading">
          Finding tracks for your "{vibe.mood}" mood…
        </p>
      )}
      {vibe?.error && (
        <p className="text-red-400 text-sm" data-testid="home-vibe-error">
          Couldn't get vibe suggestions: {vibe.error}
        </p>
      )}
      {vibe?.suggestions?.length > 0 && (
        <SuggestionList tracks={vibe.suggestions} heading={`For your "${vibe.mood}" mood`} />
      )}

      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-white text-2xl font-bold mb-4">{section.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {section.tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onPlay={(t) => play(t, section.tracks)}
                isActive={currentTrack?.id === track.id && isPlaying}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
