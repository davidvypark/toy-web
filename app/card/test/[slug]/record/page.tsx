import { getCardInfo } from '@/lib/card-data'
import { RecordFlow } from '@/components/record/RecordFlow'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TestRecordPage({ params }: PageProps) {
  const { slug } = await params
  const info = await getCardInfo(slug)

  return (
    <RecordFlow
      shareToken={slug}
      cardTitle={info?.cardTitle}
      recipientName={info?.recipientName}
      hostName={info?.hostName}
      hostAvatarUrl={info?.hostAvatarUrl}
    />
  )
}
