import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const video = formData.get('video') as File | null
    const shareToken = formData.get('shareToken') as string | null
    const contributorName = (formData.get('contributorName') as string | null)?.trim()
    const avatar = formData.get('avatar') as File | null

    // Validate required fields
    if (!video || !shareToken || !contributorName) {
      return NextResponse.json(
        { error: 'Missing required fields: video, shareToken, contributorName' },
        { status: 400 }
      )
    }

    if (contributorName.length === 0 || contributorName.length > 50) {
      return NextResponse.json(
        { error: 'Name must be 1-50 characters' },
        { status: 400 }
      )
    }

    // Validate video size (max 10MB)
    if (video.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Video must be under 10MB' },
        { status: 400 }
      )
    }

    // Validate avatar size if provided (max 5MB)
    if (avatar && avatar.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Photo must be under 5MB' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Look up card by share token
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id')
      .eq('share_token', shareToken)
      .in('status', ['draft', 'collecting'])
      .single()

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Card not found or no longer accepting clips' },
        { status: 404 }
      )
    }

    const participantId = crypto.randomUUID()

    // Upload video to clips bucket
    const videoBuffer = Buffer.from(await video.arrayBuffer())
    const videoPath = `${card.id}/${participantId}.webm`

    const { error: videoUploadError } = await supabase.storage
      .from('clips')
      .upload(videoPath, videoBuffer, {
        contentType: video.type || 'video/webm',
        upsert: false,
      })

    if (videoUploadError) {
      console.error('Video upload error:', videoUploadError)
      return NextResponse.json(
        { error: 'Failed to upload video' },
        { status: 500 }
      )
    }

    // Upload avatar if provided
    let avatarPath: string | null = null
    if (avatar) {
      const ext = avatar.name?.split('.').pop() || 'jpg'
      avatarPath = `web-${participantId}.${ext}`
      const avatarBuffer = Buffer.from(await avatar.arrayBuffer())

      const { error: avatarUploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, avatarBuffer, {
          contentType: avatar.type || 'image/jpeg',
          upsert: false,
        })

      if (avatarUploadError) {
        console.error('Avatar upload error:', avatarUploadError)
        // Non-fatal — continue without avatar
        avatarPath = null
      }
    }

    // Try to create a profile for this web contributor
    // This may fail if profiles has an FK to auth.users — that's OK
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: participantId,
        display_name: contributorName,
        avatar_url: avatarPath,
      }, { onConflict: 'id' })

    if (profileError) {
      console.warn('Profile creation skipped (FK constraint?):', profileError.message)
    }

    // Get next order position
    const { data: lastClip } = await supabase
      .from('clips')
      .select('order_position')
      .eq('card_id', card.id)
      .order('order_position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = (lastClip?.order_position ?? -1) + 1

    // Create clip record
    const { error: clipError } = await supabase
      .from('clips')
      .insert({
        card_id: card.id,
        participant_id: participantId,
        video_url: videoPath,
        contributor_name: contributorName,
        order_position: nextPosition,
        status: 'uploaded',
      })

    if (clipError) {
      console.error('Clip insert error:', clipError)
      return NextResponse.json(
        { error: 'Failed to save clip' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Record API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
