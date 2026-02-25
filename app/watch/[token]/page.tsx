import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VideoPlayer } from '@/components/VideoPlayer'
import { getCard, getClips, getSignedVideoUrl, getThumbnailFromClips } from '@/lib/watch-data'
export type { ClipData } from '@/lib/watch-data'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const card = await getCard(token)

  if (!card) {
    return {
      title: 'Video Not Found | TOY',
      description: 'This video may not exist or has not been published yet.',
    }
  }

  const title = `A video for ${card.recipient_name} | TOY`
  const description = card.title

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'TOY - Thinking Of You',
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function WatchPage({ params }: PageProps) {
  const { token } = await params
  const card = await getCard(token)

  if (!card) {
    notFound()
  }

  // Fetch clips and legacy montage URL in parallel
  const [clips, montageVideoUrl] = await Promise.all([
    getClips(card.id),
    card.video_url ? getSignedVideoUrl(card.video_url) : Promise.resolve(null),
  ])

  // Need either clips or a legacy montage video
  if (clips.length === 0 && !montageVideoUrl) {
    notFound()
  }

  const posterUrl = getThumbnailFromClips(clips) ?? undefined

  return (
    <main className="min-h-screen bg-toy-background">
      {/* Header */}
      <header className="py-6 text-center">
        <h1 className="text-3xl text-toy-text" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
          Thinking Of You
        </h1>
        <p className="mt-2 text-lg text-toy-text" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>{card.title}</p>
        <p className="mt-1 text-toy-text-secondary">A card for {card.recipient_name}</p>
      </header>

      {/* Video Player */}
      <section className="px-4 pb-8">
        <VideoPlayer
          clips={clips}
          montageVideoUrl={montageVideoUrl ?? undefined}
          posterUrl={posterUrl}
          recipientName={card.recipient_name}
        />
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <footer className="py-8 text-center border-t border-toy-text/10">
        <p className="text-sm text-toy-text-secondary">
          Made with{' '}
          <a
            href="https://sendtoycard.com"
            className="text-toy-text font-medium hover:underline transition-colors"
          >
            TOY
          </a>
          {' '}- Thinking Of You
        </p>
      </footer>
    </main>
  )
}
