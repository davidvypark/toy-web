import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'TOY - Thinking Of You',
  description: 'Group video cards for the people who matter',
  openGraph: {
    title: 'TOY - Thinking Of You',
    description: 'Group video cards for the people who matter',
    siteName: 'TOY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  other: {
    'apple-itms-apps': 'app-clip-bundle-id=com.kindauseful.TOY.Clip, app-id=6758913044',
  },
}

export default async function CardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-toy-background px-6 text-center">
      <h1
        className="text-6xl text-toy-text"
        style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
      >
        toy
      </h1>
      <p className="mt-4 text-lg text-toy-text-secondary">Opening your card&hellip;</p>
      <p className="mt-8 text-sm text-toy-text-secondary">
        Don&rsquo;t have the app?
      </p>
      <a
        href="https://apps.apple.com/us/app/toy-group-video-cards/id6758913044"
        className="mt-3 inline-block transition-opacity hover:opacity-70"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
          alt="Download on the App Store"
          className="h-[48px] w-auto dark:invert"
        />
      </a>
    </main>
  )
}
