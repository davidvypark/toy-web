import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { VideoPlayer } from '@/components/VideoPlayer'

interface Card {
  id: string
  title: string
  recipient_name: string
  video_url: string | null
  share_token: string
  status: string
  host_id: string
  occasion: string | null
  published_at: string | null
}

export interface ClipData {
  id: string
  signedVideoUrl: string
  thumbnailUrl: string | null
  contributorName: string | null
  contributorAvatarUrl: string | null
  durationSeconds: number | null
  orderPosition: number
}

interface PageProps {
  params: Promise<{ token: string }>
}

async function getCard(shareToken: string): Promise<Card | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('share_token', shareToken)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as Card
}

async function getSignedVideoUrl(videoPath: string): Promise<string | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .storage
    .from('videos')
    .createSignedUrl(videoPath?.trim(), 60 * 60)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

async function getClips(cardId: string): Promise<ClipData[]> {
  const supabase = createServerClient()
  const supabaseUrl = process.env.SUPABASE_URL

  // Fetch clips ordered by position
  const { data: clips, error } = await supabase
    .from('clips')
    .select('id, card_id, participant_id, video_url, thumbnail_url, duration_seconds, order_position, contributor_name, status')
    .eq('card_id', cardId)
    .eq('status', 'uploaded')
    .order('order_position', { ascending: true })

  if (error || !clips?.length) return []

  // Collect unique participant IDs for profile lookup
  const participantIds = [...new Set(clips.map(c => c.participant_id))]

  // Fetch profiles and generate signed URLs in parallel
  const [profilesResult, ...signedUrls] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', participantIds),
    ...clips.map(clip =>
      supabase.storage
        .from('clips')
        .createSignedUrl(clip.video_url?.trim(), 60 * 60)
    ),
  ])

  const profiles = profilesResult.data ?? []
  const profileMap = new Map(profiles.map(p => [p.id, p]))

  // Generate signed avatar URLs for profiles that have them
  const avatarSignedUrls = new Map<string, string>()
  const profilesWithAvatars = profiles.filter(p => p.avatar_url)
  if (profilesWithAvatars.length > 0) {
    const avatarResults = await Promise.all(
      profilesWithAvatars.map(p =>
        supabase.storage
          .from('avatars')
          .createSignedUrl(p.avatar_url, 60 * 60)
      )
    )
    profilesWithAvatars.forEach((p, i) => {
      const url = avatarResults[i]?.data?.signedUrl
      if (url) avatarSignedUrls.set(p.id, url)
    })
  }

  return clips.map((clip, i) => {
    const profile = profileMap.get(clip.participant_id)
    const signedUrl = signedUrls[i]?.data?.signedUrl

    if (!signedUrl) return null

    return {
      id: clip.id,
      signedVideoUrl: signedUrl,
      thumbnailUrl: clip.thumbnail_url
        ? `${supabaseUrl}/storage/v1/object/public/thumbnails/${clip.thumbnail_url}`
        : null,
      contributorName: clip.contributor_name ?? profile?.display_name ?? null,
      contributorAvatarUrl: avatarSignedUrls.get(clip.participant_id) ?? null,
      durationSeconds: clip.duration_seconds,
      orderPosition: clip.order_position ?? i,
    }
  }).filter((c): c is ClipData => c !== null)
}

function getThumbnailFromClips(clips: ClipData[]): string | null {
  return clips[0]?.thumbnailUrl ?? null
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

  // Get thumbnail for og:image
  const clips = await getClips(card.id)
  const thumbnailUrl = getThumbnailFromClips(clips)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'TOY - Thinking Of You',
      type: 'video.other',
      ...(thumbnailUrl ? { images: [{ url: thumbnailUrl }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(thumbnailUrl ? { images: [thumbnailUrl] } : {}),
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
