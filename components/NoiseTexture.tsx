'use client'

import { useEffect, useState } from 'react'

export function NoiseTexture() {
  const [noiseUrl, setNoiseUrl] = useState<string | null>(null)

  useEffect(() => {
    const size = 200
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(size, size)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
    setNoiseUrl(canvas.toDataURL('image/png'))
  }, [])

  if (!noiseUrl) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: `url(${noiseUrl})`,
        backgroundRepeat: 'repeat',
        mixBlendMode: 'multiply',
        opacity: 0.03,
      }}
    />
  )
}
