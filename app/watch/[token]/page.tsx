import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { VideoPlayer } from '@/components/VideoPlayer'

interface Card {
  id: string
  title: string
  recipient_name: string
  video_url: string
  share_token: string
  status: string
  host_id: string
  occasion: string | null
  published_at: string | null
}

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * Fetches a published card by its share token.
 * Returns null if card not found or not published.
 */
async function getCard(shareToken: string): Promise<Card | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('share_token', shareToken)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    return null
  }

  return data as Card
}

/**
 * Generates a signed URL for the video from the videos bucket.
 * The signed URL is valid for 1 hour.
 */
async function getSignedVideoUrl(videoPath: string): Promise<string | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .storage
    .from('videos')
    .createSignedUrl(videoPath?.trim(), 60 * 60) // 1 hour

  if (error || !data?.signedUrl) {
    return null
  }

  return data.signedUrl
}

/**
 * Gets the thumbnail URL for a card by finding the host's clip thumbnail,
 * falling back to the first clip by order_position.
 * Thumbnails bucket is public — no signed URL needed.
 */
async function getThumbnailUrl(cardId: string, hostId: string): Promise<string | null> {
  const supabase = createServerClient()

  // Try host's clip first
  let { data: clip } = await supabase
    .from('clips')
    .select('thumbnail_url')
    .eq('card_id', cardId)
    .eq('participant_id', hostId)
    .limit(1)
    .single()

  // Fallback to first clip by order
  if (!clip?.thumbnail_url) {
    const { data: fallback } = await supabase
      .from('clips')
      .select('thumbnail_url')
      .eq('card_id', cardId)
      .order('order_position', { ascending: true })
      .limit(1)
      .single()
    clip = fallback
  }

  if (!clip?.thumbnail_url) return null

  return `https://wlsaolscclwarmxzqjqs.supabase.co/storage/v1/object/public/thumbnails/${clip.thumbnail_url}`
}

/**
 * Generate dynamic metadata for social sharing.
 */
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

/**
 * Video viewer page for recipients.
 * Displays the published video with TOY branding and share buttons.
 */
export default async function WatchPage({ params }: PageProps) {
  const { token } = await params
  const card = await getCard(token)

  if (!card) {
    notFound()
  }

  // Get signed URL for video
  // video_url stores the path within the videos bucket (e.g., "{cardId}/montage.mp4")
  if (!card.video_url) {
    notFound()
  }

  const [signedVideoUrl, thumbnailUrl] = await Promise.all([
    getSignedVideoUrl(card.video_url),
    getThumbnailUrl(card.id, card.host_id),
  ])

  if (!signedVideoUrl) {
    notFound()
  }

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
          videoUrl={signedVideoUrl}
          recipientName={card.recipient_name}
          posterUrl={thumbnailUrl ?? undefined}
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
