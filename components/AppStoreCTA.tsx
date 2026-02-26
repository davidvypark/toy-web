'use client'

import { useState, useEffect } from 'react'

export function AppStoreCTA() {
  const [android, setAndroid] = useState(false)

  useEffect(() => {
    setAndroid(/Android/i.test(navigator.userAgent))
  }, [])

  if (android) return null

  return (
    <section className="px-4 pb-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-2 text-lg text-toy-text" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
          Create your own card
        </h2>
        <a href="https://apps.apple.com/us/app/toy-group-video-cards/id6758913044" className="inline-block transition-opacity hover:opacity-70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
            alt="Download on the App Store"
            className="h-[48px] w-auto dark:invert"
          />
        </a>
      </div>
    </section>
  )
}
