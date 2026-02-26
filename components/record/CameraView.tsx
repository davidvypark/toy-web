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
  const mimeTypeRef = useRef<string>('video/webm')

  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasClip, setHasClip] = useState(false)
  const [clipBlob, setClipBlob] = useState<Blob | null>(null)

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

    mimeTypeRef.current = mimeType

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
        setIsRecording(false)
        setElapsed(0)
        setProgress(0)
        return
      }

      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
      setClipBlob(blob)
      setHasClip(true)
    }

    recorderRef.current = recorder
    startTimeRef.current = Date.now()
    recorder.start(100)
    setIsRecording(true)
    setHasClip(false)
    setClipBlob(null)

    timerRef.current = setInterval(() => {
      const currentElapsed = (Date.now() - startTimeRef.current) / 1000
      setElapsed(currentElapsed)
      setProgress(Math.min(currentElapsed / MAX_DURATION, 1))

      if (currentElapsed >= MAX_DURATION) {
        stopRecordingRef.current()
      }
    }, 50)
  }, [isRecording])

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, stopRecording, startRecording])

  const handleStartOver = useCallback(() => {
    setHasClip(false)
    setClipBlob(null)
    setElapsed(0)
    setProgress(0)
  }, [])

  const handleDone = useCallback(() => {
    if (clipBlob) {
      onRecorded(clipBlob)
    }
  }, [clipBlob, onRecorded])

  useEffect(() => {
    let cancelled = false

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            aspectRatio: { ideal: 9 / 16 },
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

  const radius = 40
  const circumference = 2 * Math.PI * radius

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-4 py-4">
      <div className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-contain"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Loading overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/30 backdrop-blur-md">
            <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500' : hasClip ? 'bg-green-500' : 'bg-white/40'}`} />
            <span className="text-white text-sm font-mono">
              {elapsedDisplay} / {maxDisplay}
            </span>
          </div>
        </div>

        {/* Bottom controls — inside camera */}
        <div className="absolute bottom-0 left-0 right-0 pb-6 pt-12 bg-gradient-to-t from-black/60 to-transparent">
          {/* Status text */}
          <div className="text-center mb-3">
            {!isRecording && !hasClip && (
              <p className="text-white/80 text-sm">Tap to start recording</p>
            )}
            {isRecording && (
              <p className="text-white/80 text-sm">Tap to stop</p>
            )}
            {hasClip && !isRecording && (
              <p className="text-green-400 text-sm">Clip recorded</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-8">
            {/* Start Over */}
            <button
              onClick={handleStartOver}
              className={`flex flex-col items-center gap-1.5 ${hasClip && !isRecording ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
              </div>
              <span className="text-white/80 text-xs">Start Over</span>
            </button>

            {/* Record button */}
            <div className="relative w-20 h-20">
              <svg className="absolute inset-0 w-20 h-20" viewBox="0 0 88 88">
                <circle
                  cx="44" cy="44" r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="5"
                />
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
              <button
                onClick={handleToggleRecording}
                className="absolute inset-0 flex items-center justify-center"
                disabled={!cameraReady || (hasClip && !isRecording)}
              >
                <div
                  className={`rounded-full transition-all duration-150 ${
                    isRecording
                      ? 'w-8 h-8 rounded-lg bg-red-500'
                      : hasClip
                        ? 'w-[60px] h-[60px] bg-white/30'
                        : cameraReady
                          ? 'w-[60px] h-[60px] bg-white'
                          : 'w-[60px] h-[60px] bg-white/30'
                  }`}
                />
              </button>
            </div>

            {/* Done */}
            <button
              onClick={handleDone}
              className={`flex flex-col items-center gap-1.5 ${hasClip && !isRecording ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <svg className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <span className="text-white/80 text-xs">Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
