'use client'

import { useRef, useState, useEffect, useMemo } from 'react'

interface VideoReviewProps {
  videoBlob: Blob
  onRetake: () => void
  onConfirm: () => void
}

export function VideoReview({ videoBlob, onRetake, onConfirm }: VideoReviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = useMemo(() => URL.createObjectURL(videoBlob), [videoBlob])
  const [videoAspect, setVideoAspect] = useState('3 / 4')

  useEffect(() => {
    return () => URL.revokeObjectURL(videoUrl)
  }, [videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    const handleMetadata = () => {
      const w = video.videoWidth
      const h = video.videoHeight
      if (w && h) {
        if (w < h) {
          setVideoAspect(`${w} / ${h}`)
        } else {
          setVideoAspect(`${h} / ${w}`)
        }
      }
      video.play().catch(() => {})
    }

    video.addEventListener('loadedmetadata', handleMetadata)
    return () => video.removeEventListener('loadedmetadata', handleMetadata)
  }, [videoUrl])

  return (
    <div className="fixed inset-0 bg-toy-background flex flex-col items-center justify-center px-4 py-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: videoAspect }}>
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
