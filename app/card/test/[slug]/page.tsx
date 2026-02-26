import { getCardInfo } from '@/lib/card-data'
import { CardPageClient } from '@/components/CardPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TestCardPage({ params }: PageProps) {
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
      testMode
    />
  )
}
