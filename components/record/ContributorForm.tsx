'use client'

import { useState, useRef } from 'react'

interface ContributorFormProps {
  onSubmit: (name: string, avatar: File | null) => void
}

export function ContributorForm({ onSubmit }: ContributorFormProps) {
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (trimmed.length === 0 || trimmed.length > 50) return
    onSubmit(trimmed, avatarFile)
  }

  const isValid = name.trim().length > 0 && name.trim().length <= 50

  return (
    <div className="fixed inset-0 bg-toy-background flex flex-col select-none">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Header */}
          <h1
            className="text-2xl text-toy-text text-center mb-8"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
          >
            Sign Your Name
          </h1>

          {/* Avatar picker */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-toy-divider flex items-center justify-center transition-opacity hover:opacity-80"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Your photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <svg className="h-8 w-8 text-toy-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                  </svg>
                  <span className="text-xs text-toy-text-secondary">Add selfie</span>
                </div>
              )}

              {/* Edit badge */}
              {avatarPreview && (
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-toy-primary flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                  </svg>
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Name input */}
          <label className="block mb-2">
            <span
              className="text-lg text-toy-text"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              What&apos;s your name?
            </span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-toy-divider bg-toy-surface text-toy-text placeholder:text-toy-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-toy-primary/30 focus:border-toy-primary"
          />
          <p className="mt-1.5 text-xs text-toy-text-secondary">
            This will appear on the card
          </p>
        </div>
      </div>

      {/* Submit button */}
      <div className="px-6 pb-[max(env(safe-area-inset-bottom),32px)] pt-4">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full max-w-sm mx-auto block px-6 py-3.5 bg-toy-primary text-white rounded-2xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-toy-primary-dark"
        >
          Submit
        </button>
      </div>
    </div>
  )
}
