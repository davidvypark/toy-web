import { createServerClient } from '@/lib/supabase'

export interface Card {
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
  videoPath: string
  thumbnailUrl: string | null
  contributorName: string | null
  contributorAvatarUrl: string | null
  durationSeconds: number | null
  orderPosition: number
}

export interface ClipContributor {
  contributorName: string | null
  contributorAvatarUrl: string | null
}

export interface ContributorSummary {
  totalPeople: number
  contributors: ClipContributor[]
}

export async function getCard(shareToken: string): Promise<Card | null> {
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

export async function getSignedVideoUrl(videoPath: string): Promise<string | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .storage
    .from('videos')
    .createSignedUrl(videoPath?.trim(), 60 * 60)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function getClips(cardId: string): Promise<ClipData[]> {
  const supabase = createServerClient()
  const supabaseUrl = process.env.SUPABASE_URL

  const { data: clips, error } = await supabase
    .from('clips')
    .select('id, card_id, participant_id, video_url, thumbnail_url, duration_seconds, order_position, contributor_name, status')
    .eq('card_id', cardId)
    .eq('status', 'uploaded')
    .order('order_position', { ascending: true })

  if (error || !clips?.length) return []

  const participantIds = [...new Set(clips.map(c => c.participant_id))]

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

    if (!signedUrl) {
      console.error(`[watch] Failed to sign URL for clip ${clip.id}, path: ${clip.video_url}`)
      return null
    }

    console.log(`[watch] Clip ${i}: id=${clip.id}, path=${clip.video_url}, duration=${clip.duration_seconds}s, contributor=${clip.contributor_name ?? profile?.display_name ?? 'unknown'}`)

    return {
      id: clip.id,
      signedVideoUrl: signedUrl,
      videoPath: clip.video_url,
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

export function getThumbnailFromClips(clips: ClipData[]): string | null {
  return clips[0]?.thumbnailUrl ?? null
}

/** Lightweight query for OG images — only fetches contributor names and avatars, no video URLs */
export async function getClipContributors(cardId: string): Promise<ContributorSummary> {
  const supabase = createServerClient()

  const { data: clips, error } = await supabase
    .from('clips')
    .select('participant_id, contributor_name')
    .eq('card_id', cardId)
    .eq('status', 'uploaded')

  if (error || !clips?.length) return { totalPeople: 0, contributors: [] }

  // Deduplicate by participant_id
  const uniqueParticipantIds = [...new Set(clips.map(c => c.participant_id))]
  const totalPeople = uniqueParticipantIds.length

  // Fetch profiles for unique participants
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', uniqueParticipantIds)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Sign avatar URLs for profiles that have them
  const avatarSignedUrls = new Map<string, string>()
  const profilesWithAvatars = (profiles ?? []).filter(p => p.avatar_url)
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

  // Build contributor name from clip's contributor_name or profile display_name
  const clipByParticipant = new Map(clips.map(c => [c.participant_id, c]))

  const contributors: ClipContributor[] = uniqueParticipantIds.map(pid => {
    const clip = clipByParticipant.get(pid)
    const profile = profileMap.get(pid)
    return {
      contributorName: clip?.contributor_name ?? profile?.display_name ?? null,
      contributorAvatarUrl: avatarSignedUrls.get(pid) ?? null,
    }
  })

  return { totalPeople, contributors }
}
