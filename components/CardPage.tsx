'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CardPageClientProps {
  cardId?: string
  shareToken?: string
  cardTitle?: string
  recipientName?: string
  hostName?: string | null
  hostAvatarUrl?: string | null
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function CardPageClient({ shareToken, cardTitle, recipientName, hostName, hostAvatarUrl }: CardPageClientProps) {
  const [android, setAndroid] = useState(false)

  useEffect(() => {
    setAndroid(isAndroid())
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center bg-toy-background px-6 text-center">
      {/* Center the content */}
      <div className="flex-1 flex flex-col items-center justify-center">

        {/* Personalized card info */}
        <div className="mb-8">
          {hostAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hostAvatarUrl}
              alt={hostName ?? ''}
              className="mx-auto mb-4 h-16 w-16 rounded-full object-cover shadow-md"
            />
          ) : hostName ? (
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-toy-primary flex items-center justify-center shadow-md">
              <span className="text-2xl font-medium text-toy-background">
                {hostName.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : null}

          <p className="text-lg text-toy-text" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
            {hostName
              ? `${hostName} invited you to record a 7-second video`
              : 'You\u2019ve been invited to record a 7-second video'}
            {recipientName && (
              <> for <span className="font-medium">{recipientName}</span></>
            )}
          </p>

          {cardTitle && (
            <p className="mt-2 text-toy-text-secondary italic">
              &ldquo;{cardTitle}&rdquo;
            </p>
          )}
        </div>

        {/* Record on Web button */}
        {shareToken && (
          <Link
            href={`/card/${shareToken}/record`}
            className="w-full max-w-xs px-6 py-4 bg-toy-primary text-white dark:text-black rounded-2xl font-medium text-lg text-center transition-colors hover:bg-toy-primary-dark mb-6 block"
          >
            Record on Web
          </Link>
        )}

        {/* App Store link (iOS only, not Android) */}
        {!android && (
          <div>
            <p className="text-sm text-toy-text-secondary mb-1">
              or get the full experience
            </p>
            <div className="animate-bounce-gentle-down mb-3">
              <svg className="mx-auto h-6 w-6 text-toy-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
            <a
              href="https://apps.apple.com/us/app/toy-group-video-cards/id6758913044"
              className="inline-block transition-opacity hover:opacity-70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Download on the App Store"
                className="h-[48px] w-auto dark:invert"
              />
            </a>
          </div>
        )}

      </div>
    </main>
  )
}
