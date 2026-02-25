import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase'
import { CardPageClient } from '@/components/CardPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface CardInfo {
  cardTitle: string
  recipientName: string
  hostName: string | null
  hostAvatarUrl: string | null
}

async function getCardInfo(shareToken: string): Promise<CardInfo | null> {
  const supabase = createServerClient()

  const { data: card, error } = await supabase
    .from('cards')
    .select('title, recipient_name, host_id')
    .eq('share_token', shareToken)
    .in('status', ['collecting', 'published'])
    .single()

  if (error || !card) return null

  // Fetch host profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', card.host_id)
    .single()

  // Generate signed avatar URL if avatar exists
  let hostAvatarUrl: string | null = null
  if (profile?.avatar_url) {
    const { data: avatarData } = await supabase
      .storage
      .from('avatars')
      .createSignedUrl(profile.avatar_url, 60 * 60)
    hostAvatarUrl = avatarData?.signedUrl ?? null
  }

  return {
    cardTitle: card.title,
    recipientName: card.recipient_name,
    hostName: profile?.display_name ?? null,
    hostAvatarUrl,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const info = await getCardInfo(slug)

  if (!info) {
    return {
      title: 'TOY - Thinking Of You',
      description: 'Group video cards for the people who matter',
    }
  }

  const title = info.hostName
    ? `${info.hostName} invited you to record a video | TOY`
    : `You're invited to record a video | TOY`
  const description = `Record a 7-second video for ${info.recipientName} — "${info.cardTitle}"`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'TOY - Thinking Of You',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    other: {
      'apple-itunes-app': 'app-id=6758913044, app-clip-bundle-id=com.kindauseful.TOY.Clip, app-clip-display=card',
    },
  }
}

export default async function CardPage({ params }: PageProps) {
  const { slug } = await params
  const info = await getCardInfo(slug)

  return (
    <CardPageClient
      cardTitle={info?.cardTitle}
      recipientName={info?.recipientName}
      hostName={info?.hostName}
      hostAvatarUrl={info?.hostAvatarUrl}
    />
  )
}
