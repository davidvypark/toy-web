'use client'

import { useRef, useEffect, useMemo } from 'react'

interface VideoReviewProps {
  videoBlob: Blob
  onRetake: () => void
  onConfirm: () => void
}

export function VideoReview({ videoBlob, onRetake, onConfirm }: VideoReviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = useMemo(() => URL.createObjectURL(videoBlob), [videoBlob])

  useEffect(() => {
    return () => URL.revokeObjectURL(videoUrl)
  }, [videoUrl])

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked — user can tap to play
      })
    }
  }, [videoUrl])

  return (
    <div className="fixed inset-0 bg-toy-background flex flex-col items-center justify-center px-4 py-4">
      <div className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-black">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            loop
            playsInline
            autoPlay
            muted={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        {/* "Thinking Of You" overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span
            className="text-white text-xl drop-shadow-lg"
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Thinking Of You
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 w-full max-w-sm">
        <div className="flex gap-4">
          <button
            onClick={onRetake}
            className="flex-1 px-6 py-3.5 border-2 border-black text-black rounded-2xl font-medium transition-colors hover:bg-black/5"
          >
            Retake
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3.5 bg-black text-white rounded-2xl font-medium transition-colors hover:bg-black/80"
          >
            Use Video
          </button>
        </div>
      </div>
    </div>
  )
}
