'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase-browser'
import { CameraView } from './CameraView'
import { VideoReview } from './VideoReview'
import { ContributorForm } from './ContributorForm'

type RecordStep = 'invite' | 'camera' | 'review' | 'details' | 'submitting' | 'done'

interface RecordFlowProps {
  shareToken: string
  cardTitle?: string
  recipientName?: string
  hostName?: string | null
  hostAvatarUrl?: string | null
}

export function RecordFlow({
  shareToken,
  cardTitle,
  recipientName,
  hostName,
  hostAvatarUrl,
}: RecordFlowProps) {
  const [step, setStep] = useState<RecordStep>('invite')
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleRecorded = useCallback((blob: Blob) => {
    setVideoBlob(blob)
    setStep('review')
  }, [])

  const handleRetake = useCallback(() => {
    setVideoBlob(null)
    setStep('camera')
  }, [])

  const handleConfirmVideo = useCallback(() => {
    setStep('details')
  }, [])

  const handleSubmit = useCallback(async (name: string, avatar: File | null) => {
    if (!videoBlob) return
    setStep('submitting')
    setUploadError(null)

    try {
      // Sign in anonymously to get a real auth.users ID
      // (mirrors the iOS App Clip pattern)
      const supabase = createBrowserClient()
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError || !authData.session) {
        throw new Error('Authentication failed')
      }

      const formData = new FormData()
      formData.append('video', videoBlob, 'clip.webm')
      formData.append('shareToken', shareToken)
      formData.append('contributorName', name)
      if (avatar) {
        formData.append('avatar', avatar)
      }

      const response = await fetch('/api/record', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }

      setStep('done')
    } catch (err) {
      const error = err as Error
      setUploadError(error.message || 'Something went wrong. Please try again.')
      setStep('details')
    }
  }, [videoBlob, shareToken])

  // Step: Invite
  if (step === 'invite') {
    return (
      <main className="flex h-[100dvh] flex-col bg-toy-background px-6 py-6 overflow-hidden">
        {/* Branding */}
        <h1
          className="text-3xl leading-tight text-toy-text mt-2"
          style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', lineHeight: '0.95' }}
        >
          Thinking<br />Of You
        </h1>

        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-6">
            {/* Host avatar */}
            {hostAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hostAvatarUrl}
                alt={hostName ?? ''}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-toy-divider flex items-center justify-center">
                <svg className="h-6 w-6 text-toy-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            )}

            {/* Invitation text */}
            <p className="text-base text-toy-text-secondary">
              {hostName
                ? `${hostName} has invited you to record a 7 second video message to be included in this card.`
                : 'You\u2019ve been invited to record a 7 second video message to be included in this card.'}
            </p>

            {/* Card title and recipient */}
            <div className="space-y-1">
              {cardTitle && (
                <h2
                  className="text-2xl text-toy-text"
                  style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                >
                  {cardTitle}
                </h2>
              )}
              {recipientName && (
                <p
                  className="text-xl text-toy-text-secondary"
                  style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                >
                  For {recipientName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Record button */}
        <button
          onClick={() => setStep('camera')}
          className="w-full px-6 py-4 bg-toy-primary text-white rounded-2xl font-medium text-lg transition-colors hover:bg-toy-primary-dark mb-4"
        >
          Record Now
        </button>
      </main>
    )
  }

  // Step: Camera
  if (step === 'camera') {
    return (
      <CameraView
        onRecorded={handleRecorded}
        onBack={() => setStep('invite')}
      />
    )
  }

  // Step: Review
  if (step === 'review' && videoBlob) {
    return (
      <VideoReview
        videoBlob={videoBlob}
        onRetake={handleRetake}
        onConfirm={handleConfirmVideo}
      />
    )
  }

  // Step: Details
  if (step === 'details') {
    return (
      <>
        <ContributorForm onSubmit={handleSubmit} />
        {uploadError && (
          <div className="fixed top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center z-50">
            {uploadError}
          </div>
        )}
      </>
    )
  }

  // Step: Submitting
  if (step === 'submitting') {
    return (
      <div className="fixed inset-0 bg-toy-background flex flex-col items-center justify-center px-6">
        <div className="h-10 w-10 border-3 border-toy-divider border-t-toy-primary rounded-full animate-spin mb-6" />
        <p className="text-toy-text-secondary">Uploading your clip...</p>
      </div>
    )
  }

  // Step: Done
  if (step === 'done') {
    return (
      <div className="fixed inset-0 bg-toy-background flex flex-col items-center justify-center px-6 text-center">
        <svg className="h-20 w-20 text-green-500 mb-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
        </svg>

        <h2
          className="text-3xl text-toy-text mb-3"
          style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
        >
          Clip Submitted!
        </h2>

        <p className="text-toy-text-secondary max-w-xs">
          Your video message has been added to the card. The recipient will love it!
        </p>
      </div>
    )
  }

  // Fallback
  return null
}
