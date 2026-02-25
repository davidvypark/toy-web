import { ImageResponse } from 'next/og'
import { getCard, getClipContributors } from '@/lib/watch-data'
import {
  getOgFonts,
  fetchAvatarAsDataUri,
  OG_COLORS,
  OG_SIZE,
  truncate,
} from '@/lib/og-utils'

export const alt = 'TOY video greeting card'
export const size = OG_SIZE
export const contentType = 'image/png'
export const revalidate = 3600

function fallback() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: OG_COLORS.background,
          fontSize: 48,
          color: OG_COLORS.text,
        }}
      >
        Thinking of You
      </div>
    ),
    { ...size }
  )
}

export default async function WatchOgImage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  try {
    const { token } = await params
    const [card, fonts] = await Promise.all([getCard(token), getOgFonts()])

    if (!card) return fallback()

    const { totalPeople, contributors } = await getClipContributors(card.id)

    // Fetch up to 5 avatars as data URIs (only those with avatar URLs)
    const contributorsWithAvatars = contributors.filter(
      (c) => c.contributorAvatarUrl
    )
    const avatarsToShow = contributorsWithAvatars.slice(0, 5)
    const avatarDataUris = await Promise.all(
      avatarsToShow.map((c) => fetchAvatarAsDataUri(c.contributorAvatarUrl!))
    )
    const validAvatars = avatarDataUris.filter(
      (uri): uri is string => uri !== null
    )
    const remainingCount = totalPeople - validAvatars.length

    const cardTitle = truncate(card.title, 40)
    const recipientName = truncate(card.recipient_name, 25)
    const peopleLabel = totalPeople === 1 ? '1 person' : `${totalPeople} people`

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
              marginTop: 12,
              display: 'flex',
            }}
          >
            A card for {recipientName}
          </div>

          {/* Avatar row */}
          {validAvatars.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 36,
              }}
            >
              {validAvatars.map((uri, i) => (
                <div
                  key={i}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    border: '3px solid #FFFFFF',
                    overflow: 'hidden',
                    marginLeft: i === 0 ? 0 : -16,
                    display: 'flex',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uri}
                    width={72}
                    height={72}
                    style={{ objectFit: 'cover' }}
                    alt=""
                  />
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    border: '3px solid #FFFFFF',
                    backgroundColor: OG_COLORS.divider,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: -16,
                    fontFamily: 'Geist',
                    fontSize: 24,
                    color: OG_COLORS.textSecondary,
                  }}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          )}

          {/* People count */}
          {totalPeople > 0 && (
            <div
              style={{
                fontFamily: 'Geist',
                fontSize: 22,
                color: OG_COLORS.textSecondary,
                marginTop: 16,
                display: 'flex',
              }}
            >
              {peopleLabel}
            </div>
          )}

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
  } catch {
    return fallback()
  }
}
