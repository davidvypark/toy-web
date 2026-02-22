'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface ClipData {
  id: string
  signedVideoUrl: string
  thumbnailUrl: string | null
  contributorName: string | null
  contributorAvatarUrl: string | null
  durationSeconds: number | null
  orderPosition: number
}

interface VideoPlayerProps {
  clips: ClipData[]
  montageVideoUrl?: string
  posterUrl?: string
  recipientName: string
}

// Play icon SVG path
const PLAY_ICON = "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"

// Replay icon SVG path
const REPLAY_ICON = "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"

export function VideoPlayer({ clips, montageVideoUrl, posterUrl, recipientName }: VideoPlayerProps) {
  // Legacy montage mode
  if (montageVideoUrl) {
    return <MontagePlayer videoUrl={montageVideoUrl} posterUrl={posterUrl} />
  }

  // Sequential clip mode
  return <ClipPlayer clips={clips} posterUrl={posterUrl} />
}

/** Legacy single-video player for old stitched cards */
function MontagePlayer({ videoUrl, posterUrl }: { videoUrl: string; posterUrl?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoaded = () => setIsLoading(false)
    const handleError = () => { setHasError(true); setIsLoading(false) }

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('error', handleError)
    const timeout = setTimeout(() => setIsLoading(false), 3000)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('error', handleError)
      clearTimeout(timeout)
    }
  }, [])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleEnded = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    setIsPlaying(false)
  }

  if (hasError) return <ErrorState />

  return (
    <div className="mx-auto max-w-md">
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-xl bg-black">
        {isLoading && <LoadingSpinner />}
        <div onClick={togglePlayPause} className="cursor-pointer absolute inset-0">
          <video
            ref={videoRef}
            poster={posterUrl}
            preload="metadata"
            playsInline
            onEnded={handleEnded}
            className="w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          {!isPlaying && !isLoading && <PlayOverlay icon={PLAY_ICON} />}
        </div>
      </div>
    </div>
  )
}

/** Sequential clip player with double-buffered playback and contributor overlays */
function ClipPlayer({ clips, posterUrl }: { clips: ClipData[]; posterUrl?: string }) {
  const videoARef = useRef<HTMLVideoElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)

  // Which buffer (A=0, B=1) is currently active/visible
  const [activeBuffer, setActiveBuffer] = useState<0 | 1>(0)
  const [clipIndex, setClipIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Track which contributor is showing (for fade animation)
  const [visibleContributor, setVisibleContributor] = useState<{ name: string | null; avatarUrl: string | null } | null>(null)

  const getVideoRef = useCallback((buffer: 0 | 1) => {
    return buffer === 0 ? videoARef : videoBRef
  }, [])

  // Set up initial clip sources
  useEffect(() => {
    if (clips.length === 0) return

    const activeVideo = getVideoRef(0).current
    if (activeVideo) {
      activeVideo.src = clips[0].signedVideoUrl
      activeVideo.load()
    }

    // Preload second clip if available
    if (clips.length > 1) {
      const nextVideo = getVideoRef(1).current
      if (nextVideo) {
        nextVideo.src = clips[1].signedVideoUrl
        nextVideo.preload = 'auto'
        nextVideo.load()
      }
    }
  }, [clips, getVideoRef])

  // Handle loading state
  useEffect(() => {
    const video = getVideoRef(0).current
    if (!video) return

    const handleLoaded = () => setIsLoading(false)
    const handleError = () => { setHasError(true); setIsLoading(false) }

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('error', handleError)
    const timeout = setTimeout(() => setIsLoading(false), 3000)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('error', handleError)
      clearTimeout(timeout)
    }
  }, [getVideoRef])

  // Handle clip ended — advance to next or finish
  const handleClipEnded = useCallback(() => {
    const nextIndex = clipIndex + 1

    if (nextIndex >= clips.length) {
      // All clips played
      setIsPlaying(false)
      setIsFinished(true)
      setVisibleContributor(null)
      return
    }

    // Swap buffers
    const nextBuffer = activeBuffer === 0 ? 1 : 0 as 0 | 1
    const nextVideo = getVideoRef(nextBuffer).current

    if (nextVideo) {
      nextVideo.play()
    }

    setActiveBuffer(nextBuffer)
    setClipIndex(nextIndex)
    setVisibleContributor({
      name: clips[nextIndex].contributorName,
      avatarUrl: clips[nextIndex].contributorAvatarUrl,
    })

    // Preload the clip after next
    const preloadIndex = nextIndex + 1
    if (preloadIndex < clips.length) {
      const preloadVideo = getVideoRef(activeBuffer).current // reuse the old active buffer
      if (preloadVideo) {
        preloadVideo.src = clips[preloadIndex].signedVideoUrl
        preloadVideo.preload = 'auto'
        preloadVideo.load()
      }
    }
  }, [clipIndex, clips, activeBuffer, getVideoRef])

  const startPlayback = () => {
    const video = getVideoRef(activeBuffer).current
    if (!video) return
    video.play()
    setIsPlaying(true)
    setIsFinished(false)
    setVisibleContributor({
      name: clips[0].contributorName,
      avatarUrl: clips[0].contributorAvatarUrl,
    })
  }

  const replay = () => {
    // Reset everything
    setClipIndex(0)
    setActiveBuffer(0)
    setIsFinished(false)

    const videoA = getVideoRef(0).current
    const videoB = getVideoRef(1).current

    if (videoA) {
      videoA.src = clips[0].signedVideoUrl
      videoA.load()
      videoA.play()
    }
    if (videoB && clips.length > 1) {
      videoB.src = clips[1].signedVideoUrl
      videoB.preload = 'auto'
      videoB.load()
    }

    setIsPlaying(true)
    setVisibleContributor({
      name: clips[0].contributorName,
      avatarUrl: clips[0].contributorAvatarUrl,
    })
  }

  const togglePlayPause = () => {
    if (isFinished) {
      replay()
      return
    }
    if (!isPlaying) {
      startPlayback()
      return
    }
    const video = getVideoRef(activeBuffer).current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  if (hasError) return <ErrorState />

  return (
    <div className="mx-auto max-w-md">
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-xl bg-black">
        {isLoading && <LoadingSpinner />}

        {/* Double-buffered video elements */}
        <div onClick={togglePlayPause} className="cursor-pointer absolute inset-0">
          <video
            ref={videoARef}
            playsInline
            preload="metadata"
            poster={posterUrl}
            onEnded={handleClipEnded}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150"
            style={{ opacity: activeBuffer === 0 ? 1 : 0 }}
          />
          <video
            ref={videoBRef}
            playsInline
            preload="auto"
            onEnded={handleClipEnded}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150"
            style={{ opacity: activeBuffer === 1 ? 1 : 0 }}
          />
        </div>

        {/* Contributor overlay — top left */}
        {isPlaying && visibleContributor?.name && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              key={clipIndex}
            >
              {visibleContributor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={visibleContributor.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {visibleContributor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-white text-sm font-medium">
                {visibleContributor.name}
              </span>
            </div>
          </div>
        )}

        {/* Brand text — bottom center */}
        {isPlaying && (
          <div className="absolute bottom-4 inset-x-0 z-20 text-center pointer-events-none">
            <span
              className="text-white/80 text-sm tracking-wide"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              Thinking Of You
            </span>
          </div>
        )}

        {/* Clip progress dots */}
        {isPlaying && clips.length > 1 && (
          <div className="absolute bottom-10 inset-x-0 z-20 flex justify-center gap-1.5 pointer-events-none">
            {clips.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  i === clipIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Play / Replay overlay */}
        {!isPlaying && !isLoading && (
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 cursor-pointer"
          >
            <PlayOverlay icon={isFinished ? REPLAY_ICON : PLAY_ICON} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Shared play/replay button overlay */
function PlayOverlay({ icon }: { icon: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
      <div className="p-4 rounded-full bg-black/50">
        <svg
          className="h-12 w-12 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-toy-surface z-10">
      <div className="animate-pulse">
        <svg
          className="h-12 w-12 text-toy-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={PLAY_ICON} />
        </svg>
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="mx-auto max-w-md">
      <div className="aspect-[9/16] rounded-2xl bg-toy-surface flex items-center justify-center shadow-xl">
        <div className="text-center p-8">
          <svg
            className="mx-auto h-16 w-16 text-toy-text-secondary opacity-50 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-toy-text-secondary">
            Unable to load video. Please try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  )
}
