import { Metadata } from 'next'
import { getCardInfo } from '@/lib/card-data'
import { CardPageClient } from '@/components/CardPage'

interface PageProps {
  params: Promise<{ slug: string }>
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
    ? `${info.hostName} invited you to record a video for ${info.recipientName} | TOY`
    : `You're invited to record a video for ${info.recipientName} | TOY`
  const description = `Record a 7-second video for ${info.recipientName} — "${info.cardTitle}"`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'TOY - Thinking Of You',
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
      cardId={info?.cardId}
      shareToken={slug}
      cardTitle={info?.cardTitle}
      recipientName={info?.recipientName}
      hostName={info?.hostName}
      hostAvatarUrl={info?.hostAvatarUrl}
    />
  )
}
