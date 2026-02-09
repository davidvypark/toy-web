import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact | TOY',
  description: 'Get in touch with the TOY team',
}

export default function Contact() {
  return (
    <main className="min-h-screen bg-toy-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Link href="/" className="text-toy-text-secondary text-sm hover:underline">
          &larr; Back to TOY
        </Link>

        <h1 className="mt-8 text-4xl text-toy-text">Contact</h1>
        <p className="mt-3 text-toy-text-secondary">Get in touch with us</p>

        <div className="mt-10 flex flex-col gap-4">
          <a
            href="https://x.com/dayonefoundry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-3 bg-toy-text text-toy-background rounded-full font-medium hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @dayonefoundry
          </a>

          <a
            href="mailto:davidparkyt@gmail.com"
            className="flex items-center justify-center gap-3 px-6 py-3 border border-toy-text text-toy-text rounded-full font-medium hover:bg-toy-text hover:text-toy-background transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            Email Us
          </a>
        </div>
      </div>

      <footer className="absolute bottom-8 text-center">
        <p className="text-sm text-toy-text-secondary">
          <span className="text-toy-text font-medium">TOY</span> - Thinking Of You
        </p>
      </footer>
    </main>
  )
}
