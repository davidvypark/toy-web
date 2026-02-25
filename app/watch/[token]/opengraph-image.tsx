import { ImageResponse } from 'next/og'
import { getCard, getClipContributors } from '@/lib/watch-data'
import {
  getOgFonts,
  fetchAvatarAsDataUri,
  staticOgFallback,
  OG_COLORS,
  OG_SIZE,
  truncate,
} from '@/lib/og-utils'

export const alt = 'TOY video greeting card'
export const size = OG_SIZE
export const contentType = 'image/png'
export const revalidate = 3600

export default async function WatchOgImage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let fonts
  try {
    fonts = await getOgFonts()
  } catch (e) {
    console.error('[OG watch] Font loading failed:', e)
    return await staticOgFallback()
  }

  let card
  try {
    card = await getCard(token)
  } catch (e) {
    console.error('[OG watch] Data fetch failed:', e)
    return await staticOgFallback()
  }

  if (!card) {
    console.error('[OG watch] No card found for token:', token)
    return await staticOgFallback()
  }

  try {
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
              fontSize: 72,
              color: OG_COLORS.text,
              textAlign: 'center',
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {cardTitle}
          </div>

          {/* Recipient */}
          <div
            style={{
              fontFamily: 'Geist',
              fontSize: 40,
              color: OG_COLORS.textSecondary,
              marginTop: 20,
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
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    border: '3px solid #FFFFFF',
                    overflow: 'hidden',
                    marginLeft: i === 0 ? 0 : -20,
                    display: 'flex',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uri}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover' }}
                    alt=""
                  />
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    border: '3px solid #FFFFFF',
                    backgroundColor: OG_COLORS.divider,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: -20,
                    fontFamily: 'Geist',
                    fontSize: 32,
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
                fontSize: 32,
                color: OG_COLORS.textSecondary,
                marginTop: 16,
                display: 'flex',
              }}
            >
              {peopleLabel}
            </div>
          )}

          {/* Branding — top right */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 52,
              fontFamily: 'DM Serif Display',
              fontSize: 36,
              color: OG_COLORS.text,
              opacity: 0.35,
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
    console.error('[OG watch] Render failed:', e)
    return await staticOgFallback()
  }
}
