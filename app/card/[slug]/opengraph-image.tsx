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
  try {
    const { slug } = await params
    const fonts = await getOgFonts()
    const info = await getCardInfo(slug)

    if (!info) return await staticOgFallback()

    let avatarDataUri: string | null = null
    if (info.hostAvatarUrl) {
      avatarDataUri = await fetchAvatarAsDataUri(info.hostAvatarUrl)
    }

    const cardTitle = truncate(info.cardTitle, 40)
    const recipientName = truncate(info.recipientName, 25)
    const hostName = info.hostName ? truncate(info.hostName, 25) : null
    const initial = hostName ? hostName[0].toUpperCase() : null

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
          {/* Host avatar */}
          {avatarDataUri ? (
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
          ) : initial ? (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: OG_COLORS.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                fontFamily: 'Geist',
                fontSize: 48,
                color: OG_COLORS.background,
              }}
            >
              {initial}
            </div>
          ) : null}

          {/* Invitation text */}
          <div
            style={{
              fontFamily: 'DM Serif Display',
              fontSize: 42,
              color: OG_COLORS.text,
              textAlign: 'center',
              lineHeight: 1.2,
              display: 'flex',
            }}
          >
            {hostName
              ? `${hostName} invited you to make a clip`
              : 'You\u2019re invited to make a clip'}
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
            for {recipientName}
          </div>

          {/* Card title */}
          <div
            style={{
              fontFamily: 'Geist',
              fontSize: 24,
              color: OG_COLORS.textSecondary,
              marginTop: 12,
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            {'\u201C'}{cardTitle}{'\u201D'}
          </div>

          {/* Branding — bottom right */}
          <div
            style={{
              position: 'absolute',
              bottom: 36,
              right: 48,
              fontFamily: 'DM Serif Display',
              fontSize: 20,
              color: OG_COLORS.divider,
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
    console.error('Card OG image generation failed:', e)
    return await staticOgFallback()
  }
}
