'use client'

import { useState, useCallback, useEffect } from 'react'
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
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videoThumbnail, setVideoThumbnail] = useState<Blob | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [android, setAndroid] = useState(false)

  useEffect(() => {
    setAndroid(/Android/i.test(navigator.userAgent))
  }, [])

  const handleRecorded = useCallback((blob: Blob, duration: number, thumbnail: Blob) => {
    setVideoBlob(blob)
    setVideoDuration(duration)
    setVideoThumbnail(thumbnail)
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
      const supabase = createBrowserClient()

      // Step 1: Anonymous auth
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError || !authData.session) {
        throw new Error('Authentication failed')
      }
      const userId = authData.session.user.id

      // Step 2: Fetch card & join as participant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: card, error: cardError } = await (supabase.from('cards') as any)
        .select('*')
        .eq('share_token', shareToken)
        .single() as { data: any; error: any }

      if (cardError || !card) {
        throw new Error('Card not found or no longer accepting clips')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: participantError } = await (supabase.from('participants') as any).insert({
        card_id: card.id,
        user_id: userId,
        invite_token: crypto.randomUUID(),
        status: 'viewed',
      })
      if (participantError) {
        console.error('Participant insert error:', participantError)
      }

      // Step 3: Upload video to clips bucket
      const clipId = crypto.randomUUID()
      const ext = videoBlob.type.includes('mp4') ? 'mov' : 'webm'

      const { error: videoUploadError } = await supabase.storage
        .from('clips')
        .upload(`${clipId}.${ext}`, videoBlob, {
          contentType: videoBlob.type,
          cacheControl: '2592000',
        })

      if (videoUploadError) {
        throw new Error('Failed to upload video')
      }

      // Step 4: Upload thumbnail (captured from canvas in CameraView)
      if (videoThumbnail) {
        await supabase.storage
          .from('thumbnails')
          .upload(`${clipId}.jpg`, videoThumbnail, {
            contentType: 'image/jpeg',
            cacheControl: '2592000',
          })
      }

      // Step 6: Get next order position & insert clip record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lastClip } = await (supabase.from('clips') as any)
        .select('order_position')
        .eq('card_id', card.id)
        .order('order_position', { ascending: false })
        .limit(1)
        .single() as { data: any }

      const nextPosition = Math.max((lastClip?.order_position ?? 0) + 1, 1)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: clipError } = await (supabase.from('clips') as any).insert({
        card_id: card.id,
        participant_id: userId,
        video_url: `${clipId}.${ext}`,
        thumbnail_url: `${clipId}.jpg`,
        duration_seconds: videoDuration,
        order_position: nextPosition,
        status: 'uploaded',
      })

      if (clipError) {
        throw new Error('Failed to save clip')
      }

      // Step 7: Update participant status & profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('participants') as any)
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('card_id', card.id)
        .eq('user_id', userId)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any)
        .update({ display_name: name })
        .eq('id', userId)

      // Avatar upload (if provided)
      if (avatar) {
        await supabase.storage
          .from('avatars')
          .upload(`${userId}/avatar.jpg`, avatar, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${userId}/avatar.jpg`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any)
          .update({ avatar_url: publicUrl })
          .eq('id', userId)
      }

      setStep('done')
    } catch (err) {
      const error = err as Error
      setUploadError(error.message || 'Something went wrong. Please try again.')
      setStep('details')
    }
  }, [videoBlob, videoDuration, videoThumbnail, shareToken])

  // Step: Invite
  if (step === 'invite') {
    return (
      <main className="flex h-[100dvh] flex-col bg-toy-background px-6 py-6 overflow-hidden select-none">
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
          className="w-full px-6 py-4 bg-toy-primary text-white dark:text-black rounded-2xl font-medium text-lg transition-colors hover:bg-toy-primary-dark mb-4"
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
      <div className="fixed inset-0 bg-toy-background flex flex-col items-center justify-center px-6 select-none">
        <div className="h-10 w-10 border-3 border-toy-divider border-t-toy-primary rounded-full animate-spin mb-6" />
        <p className="text-toy-text-secondary">Uploading your clip...</p>
      </div>
    )
  }

  // Step: Done
  if (step === 'done') {
    return (
      <div className="fixed inset-0 bg-toy-background flex flex-col items-center justify-center px-6 text-center select-none">
        <svg className="h-20 w-20 text-green-500 mb-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
        </svg>

        <h2
          className="text-3xl text-toy-text mb-3"
          style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
        >
          Clip Submitted!
        </h2>

        <p className="text-toy-text-secondary max-w-xs mb-8">
          Your video message has been added to the card.
        </p>

        {!android && (
          <>
            <p className="text-toy-text-secondary max-w-xs">
              Download the app to watch the full video when it&apos;s done
            </p>
            <a
              href="https://apps.apple.com/us/app/toy-group-video-cards/id6758913044"
              className="inline-block transition-opacity hover:opacity-70 mt-4"
            >
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Download on the App Store"
                className="h-[48px] w-auto dark:invert"
              />
            </a>
          </>
        )}
      </div>
    )
  }

  // Fallback
  return null
}
