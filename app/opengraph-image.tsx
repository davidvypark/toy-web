import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TOY - Thinking Of You'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const dmSerifDisplay = await fetch(
    new URL('https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFnOHM81r4j6k0gjAW3mujVU2B2K_d709jy92k.woff2')
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          background: '#FDF8F3',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: '"DM Serif Display"',
            fontSize: 220,
            color: '#1C1917',
            lineHeight: 0.85,
          }}
        >
          toy
        </div>
        <div
          style={{
            fontFamily: '"DM Serif Display"',
            fontSize: 40,
            color: '#78716C',
            marginTop: 48,
            letterSpacing: '0.02em',
          }}
        >
          Thinking Of You
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'DM Serif Display',
          data: dmSerifDisplay,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
