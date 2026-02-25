import { ImageResponse } from 'next/og'
import { getCardInfo } from '@/lib/card-data'
import {
  getOgFonts,
  fetchAvatarAsDataUri,
  staticOgFallback,
  OG_COLORS,
  OG_SIZE,
  truncate,
} from '@/lib/og-utils'

export const alt = 'TOY card invitation'
export const size = OG_SIZE
export const contentType = 'image/png'
export const revalidate = 3600

export default async function CardOgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let fonts
  try {
    fonts = await getOgFonts()
  } catch (e) {
    console.error('[OG card] Font loading failed:', e)
    return await staticOgFallback()
  }

  let info
  try {
    info = await getCardInfo(slug)
  } catch (e) {
    console.error('[OG card] Data fetch failed:', e)
    return await staticOgFallback()
  }

  if (!info) {
    console.error('[OG card] No card found for slug:', slug)
    return await staticOgFallback()
  }

  try {
    let avatarDataUri: string | null = null
    if (info.hostAvatarUrl) {
      avatarDataUri = await fetchAvatarAsDataUri(info.hostAvatarUrl)
    }

    const cardTitle = truncate(info.cardTitle, 40)
    const recipientName = truncate(info.recipientName, 25)
    const hostName = info.hostName ? truncate(info.hostName, 25) : null

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: OG_COLORS.background,
            padding: '60px 80px',
            position: 'relative',
          }}
        >
          {/* Host avatar — only if real photo exists */}
          {avatarDataUri && (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: 32,
                display: 'flex',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarDataUri}
                width={120}
                height={120}
                style={{ objectFit: 'cover' }}
                alt=""
              />
            </div>
          )}

          {/* Card title */}
          <div
            style={{
              fontFamily: 'DM Serif Display',
              fontSize: 48,
              color: OG_COLORS.text,
              textAlign: 'center',
              lineHeight: 1.2,
              display: 'flex',
            }}
          >
            {cardTitle}
          </div>

          {/* Recipient */}
          <div
            style={{
              fontFamily: 'Geist',
              fontSize: 28,
              color: OG_COLORS.textSecondary,
              marginTop: 16,
              display: 'flex',
            }}
          >
            A card for {recipientName}
          </div>

          {/* Invitation text */}
          <div
            style={{
              fontFamily: 'Geist',
              fontSize: 24,
              color: OG_COLORS.textSecondary,
              marginTop: 12,
              display: 'flex',
            }}
          >
            {hostName
              ? `${hostName} invited you to record a video to add to this card.`
              : 'You\u2019re invited to record a video to add to this card.'}
          </div>

          {/* Branding — bottom right */}
          <div
            style={{
              position: 'absolute',
              bottom: 36,
              right: 48,
              fontFamily: 'DM Serif Display',
              fontSize: 28,
              color: OG_COLORS.textSecondary,
              display: 'flex',
            }}
          >
            Thinking of You
          </div>
        </div>
      ),
      { ...size, fonts }
    )
  } catch (e) {
    console.error('[OG card] Render failed:', e)
    return await staticOgFallback()
  }
}
