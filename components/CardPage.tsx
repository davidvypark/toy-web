'use client'

import { useState, useEffect } from 'react'

interface CardPageClientProps {
  cardTitle?: string
  recipientName?: string
  hostName?: string | null
  hostAvatarUrl?: string | null
}

const IN_APP_BROWSER_PATTERNS = [
  'Telegram',
  'Instagram',
  'FBAN',
  'FBAV',
  'Line/',
  'Twitter',
  'BytedanceWebview',
  'Snapchat',
  'WeChat',
  'MicroMessenger',
]

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return IN_APP_BROWSER_PATTERNS.some(pattern => ua.includes(pattern))
}

export function CardPageClient({ cardTitle, recipientName, hostName, hostAvatarUrl }: CardPageClientProps) {
  const [inAppBrowser, setInAppBrowser] = useState(false)

  useEffect(() => {
    setInAppBrowser(isInAppBrowser())
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-toy-background px-6 py-12 text-center">
      {/* In-app browser warning */}
      {inAppBrowser && (
        <div className="mb-8 rounded-xl bg-toy-surface border border-toy-divider px-6 py-4 max-w-xs">
          <p className="text-sm font-medium text-toy-text">Open in Safari to continue</p>
          <p className="mt-1 text-xs text-toy-text-secondary">
            Tap the <span className="font-semibold">&hellip;</span> menu, then{' '}
            <span className="font-semibold">&ldquo;Open in Safari&rdquo;</span>
          </p>
        </div>
      )}

      {/* Top section — App Clip arrow */}
      {!inAppBrowser && (
        <div className="mb-8">
          <div className="animate-bounce-gentle mb-2">
            <svg className="mx-auto h-6 w-6 text-toy-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-toy-text">
            Record your clip instantly
          </p>
          <p className="mt-0.5 text-xs text-toy-text-secondary">
            No download needed — tap the banner above
          </p>
        </div>
      )}

      {/* Divider */}
      {!inAppBrowser && (
        <div className="flex items-center gap-3 mb-8 w-full max-w-xs">
          <div className="flex-1 h-px bg-toy-divider" />
          <span className="text-xs text-toy-text-secondary">or</span>
          <div className="flex-1 h-px bg-toy-divider" />
        </div>
      )}

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

      {/* Bottom section — App Store arrow */}
      <div>
        <p className="text-sm text-toy-text-secondary mb-1">
          Get the full experience
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
    </main>
  )
}
