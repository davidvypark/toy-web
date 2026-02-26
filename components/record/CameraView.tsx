'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface CameraViewProps {
  onRecorded: (blob: Blob) => void
  onBack: () => void
}

const MAX_DURATION = 7 // seconds
const MIN_DURATION = 1 // seconds

export function CameraView({ onRecorded, onBack }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  // Use a ref so the timer interval can call the latest stopRecording
  const stopRecordingRef = useRef(stopRecording)
  stopRecordingRef.current = stopRecording

  const startRecording = useCallback(() => {
    if (!streamRef.current || isRecording) return

    chunksRef.current = []

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 2_500_000,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    recorder.onstop = () => {
      const duration = (Date.now() - startTimeRef.current) / 1000
      if (duration < MIN_DURATION) {
        // Too short — reset
        setIsRecording(false)
        setElapsed(0)
        setProgress(0)
        return
      }

      const blob = new Blob(chunksRef.current, { type: mimeType })
      onRecorded(blob)
    }

    recorderRef.current = recorder
    startTimeRef.current = Date.now()
    recorder.start(100) // collect data every 100ms
    setIsRecording(true)

    // Timer for progress
    timerRef.current = setInterval(() => {
      const currentElapsed = (Date.now() - startTimeRef.current) / 1000
      setElapsed(currentElapsed)
      setProgress(Math.min(currentElapsed / MAX_DURATION, 1))

      if (currentElapsed >= MAX_DURATION) {
        stopRecordingRef.current()
      }
    }, 50)
  }, [isRecording, onRecorded])

  // Start camera on mount
  useEffect(() => {
    let cancelled = false

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: true,
        })

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraReady(true)
      } catch (err) {
        if (cancelled) return
        const e = err as Error
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setPermissionDenied(true)
        } else {
          setError('Unable to access camera. Please make sure your browser has camera permissions.')
        }
      }
    }

    initCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [stopCamera])

  // Permission denied view
  if (permissionDenied) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6 text-center">
        <svg className="h-16 w-16 text-white/50 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <h2 className="text-xl font-semibold text-white mb-2">Camera Access Required</h2>
        <p className="text-white/60 mb-8">
          TOY needs camera and microphone access to record video messages. Please enable permissions in your browser settings.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white text-black rounded-2xl font-medium"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Error view
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6 text-center">
        <svg className="h-16 w-16 text-white/50 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h2 className="text-xl font-semibold text-white mb-2">Something Went Wrong</h2>
        <p className="text-white/60 mb-8">{error}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white text-black rounded-2xl font-medium"
        >
          Go Back
        </button>
      </div>
    )
  }

  const elapsedDisplay = elapsed.toFixed(1)
  const maxDisplay = MAX_DURATION.toFixed(1)

  // SVG progress ring calculations
  const radius = 40
  const circumference = 2 * Math.PI * radius

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Camera preview */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="relative h-full max-h-full aspect-[9/16] overflow-hidden rounded-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Loading overlay */}
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),8px)]">
            {/* Close button */}
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
            >
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Time display */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/30 backdrop-blur-md">
              <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500' : 'bg-white/40'}`} />
              <span className="text-white text-sm font-mono">
                {elapsedDisplay} / {maxDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-black px-6 pb-[max(env(safe-area-inset-bottom),32px)] pt-6">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            {!isRecording && elapsed === 0 && (
              <p className="text-white/70 text-xs">Hold to Record</p>
            )}

            {/* Record button */}
            <div className="relative w-20 h-20">
              <svg className="absolute inset-0 w-20 h-20" viewBox="0 0 88 88">
                {/* Background ring */}
                <circle
                  cx="44" cy="44" r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="5"
                />
                {/* Progress ring */}
                <circle
                  cx="44" cy="44" r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  transform="rotate(-90 44 44)"
                  style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                />
              </svg>
              {/* Inner button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (cameraReady) startRecording()
                }}
                onPointerUp={(e) => {
                  e.preventDefault()
                  if (isRecording) stopRecording()
                }}
                onPointerLeave={(e) => {
                  e.preventDefault()
                  if (isRecording) stopRecording()
                }}
                className="absolute inset-0 flex items-center justify-center touch-none"
                disabled={!cameraReady}
              >
                <div
                  className={`rounded-full transition-all duration-150 ${
                    isRecording
                      ? 'w-12 h-12 bg-red-500'
                      : cameraReady
                        ? 'w-[60px] h-[60px] bg-white'
                        : 'w-[60px] h-[60px] bg-white/30'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
