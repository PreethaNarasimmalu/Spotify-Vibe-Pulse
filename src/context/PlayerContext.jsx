import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'
import { recordPlayed } from '../lib/listeningHistory'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const currentTrackRef = useRef(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)

  // Side effects (audio.play/pause) run here directly rather than inside a
  // setState updater — React may invoke updater functions more than once
  // (e.g. under StrictMode), which would double-fire those side effects.
  const play = useCallback((track, trackQueue = null) => {
    const audio = audioRef.current
    if (!audio) return
    const effectiveQueue = trackQueue ?? [track]
    const idx = effectiveQueue.findIndex((t) => t.id === track.id)
    setQueue(effectiveQueue)
    setQueueIndex(idx === -1 ? 0 : idx)

    const prevTrack = currentTrackRef.current
    if (prevTrack?.id === track.id) {
      if (audio.paused) {
        audio.play()
        setIsPlaying(true)
      } else {
        audio.pause()
        setIsPlaying(false)
      }
      return
    }

    audio.src = track.previewUrl
    audio.currentTime = 0
    audio.play()
    setIsPlaying(true)
    recordPlayed(track)
    currentTrackRef.current = track
    setCurrentTrack(track)
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    if (audio.paused) {
      audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setProgress(time)
  }, [])

  const setVolume = useCallback((v) => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = v
    setVolumeState(v)
  }, [])

  const skipNext = useCallback(() => {
    setQueue((currentQueue) => {
      setQueueIndex((currentIndex) => {
        const nextIndex = currentIndex + 1
        if (currentIndex === -1 || nextIndex >= currentQueue.length) return currentIndex
        play(currentQueue[nextIndex], currentQueue)
        return currentIndex
      })
      return currentQueue
    })
  }, [play])

  const skipPrevious = useCallback(() => {
    setQueue((currentQueue) => {
      setQueueIndex((currentIndex) => {
        const prevIndex = currentIndex - 1
        if (currentIndex <= 0) return currentIndex
        play(currentQueue[prevIndex], currentQueue)
        return currentIndex
      })
      return currentQueue
    })
  }, [play])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => setProgress(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        play,
        togglePlay,
        seek,
        setVolume,
        skipNext,
        skipPrevious,
        hasNext: queueIndex > -1 && queueIndex < queue.length - 1,
        hasPrevious: queueIndex > 0,
      }}
    >
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
