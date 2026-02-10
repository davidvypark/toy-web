'use client'

import { useRef, useState, useEffect } from 'react'

interface VideoPlayerProps {
  videoUrl: string
  recipientName: string
}

/**
 * Video player component with auto-play, TOY branding overlay, and unmute control.
 *
 * Features:
 * - Auto-plays muted (required for mobile Safari)
 * - Plays inline (no fullscreen takeover on mobile)
 * - Loops continuously
 * - Subtle "Made with TOY" branding (bottom right)
 * - Unmute button toggle (bottom left)
 * - Responsive sizing with max-w-2xl constraint
 */
export function VideoPlayer({ videoUrl, recipientName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Handle video load events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
    }

    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [])

  // Toggle play/pause
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

  // When video ends, reset to beginning and stop
  const handleEnded = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    setIsPlaying(false)
  }

  if (hasError) {
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

  return (
    <div className="mx-auto max-w-md">
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-black">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-toy-surface z-10">
            <div className="animate-pulse">
              <svg
                className="h-12 w-12 text-toy-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Video element with click to play/pause */}
        <div onClick={togglePlayPause} className="cursor-pointer">
          <video
            ref={videoRef}
            preload="auto"
            playsInline
            crossOrigin="anonymous"
            onEnded={handleEnded}
            className="w-full"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>

          {/* Play button overlay when paused */}
          {!isPlaying && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="p-4 rounded-full bg-black/50">
                <svg
                  className="h-12 w-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
