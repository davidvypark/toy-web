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
    <div className="fixed inset-0 bg-toy-background flex flex-col">
      {/* Video preview */}
      <div className="flex-1 flex items-center justify-center px-6 pt-[max(env(safe-area-inset-top),16px)]">
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
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-[max(env(safe-area-inset-bottom),32px)] pt-6">
        <div className="flex gap-4 max-w-sm mx-auto">
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
