import { createServerClient } from '@/lib/supabase'

export interface CardInfo {
  cardId: string
  cardTitle: string
  recipientName: string
  hostName: string | null
  hostAvatarUrl: string | null
}

export async function getCardInfo(shareToken: string): Promise<CardInfo | null> {
  const supabase = createServerClient()

  const { data: card, error } = await supabase
    .from('cards')
    .select('id, title, recipient_name, host_id')
    .eq('share_token', shareToken)
    .in('status', ['draft', 'collecting', 'published'])
    .single()

  if (error || !card) return null

  // Fetch host profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', card.host_id)
    .single()

  return {
    cardId: card.id,
    cardTitle: card.title,
    recipientName: card.recipient_name,
    hostName: profile?.display_name ?? null,
    hostAvatarUrl: profile?.avatar_url ?? null,
  }
}
