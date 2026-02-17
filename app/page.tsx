import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', system-ui, sans-serif" }}
    >
      <main className="mx-auto max-w-[720px] px-6">

        {/* Hero */}
        <section className="pt-[140px] pb-[72px] text-center sm:pt-[180px] sm:pb-[88px]">
          <h1 className="text-[56vw] leading-[0.8] tracking-tight sm:text-[320px]">
            toy
          </h1>
          <p
            className="mt-36 text-[26px] tracking-wide text-toy-text-secondary sm:text-[30px]"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif", fontWeight: 400 }}
          >
            Thinking Of You
          </p>
          <p className="mt-8 text-[20px] leading-relaxed text-toy-text-secondary sm:text-[22px]">
            Group video cards for the people who matter
          </p>
          <div className="mt-12">
            <AppStoreBadge />
          </div>
        </section>

        <hr className="border-toy-divider" />

        {/* How it works */}
        <section className="py-16">
          <ol className="flex flex-col gap-16">
            <Step number={1} title="Create a Group Video Card" image="/onboarding0.png">
              Record a 7-second message and tell someone special you&rsquo;re thinking of them.
            </Step>
            <Step number={2} title="Invite friends & family" image="/onboarding1.png">
              Share the card so everyone can add their own 7-second clip.
            </Step>
            <Step number={3} title="Send the Card" image="/onboarding2.png">
              For birthdays, weddings, special moments, or just because&hellip; make their day.
            </Step>
          </ol>
        </section>

        <hr className="border-toy-divider" />

        {/* CTA */}
        <section className="py-16 text-center">
          <p className="mb-8 text-[20px] text-toy-text-secondary sm:text-[22px]">
            Let someone know you&rsquo;re thinking of them.
          </p>
          <AppStoreBadge />
        </section>

        <hr className="border-toy-divider" />

        {/* Footer */}
        <footer className="py-12 text-center">
          <nav className="mb-4 flex justify-center gap-6">
            <Link href="/privacy" className="text-base text-toy-text-secondary transition-colors hover:text-toy-text">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-base text-toy-text-secondary transition-colors hover:text-toy-text">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-base text-toy-text-secondary transition-colors hover:text-toy-text">
              Contact
            </Link>
          </nav>
          <p className="text-sm text-toy-text-secondary">&copy; 2026 Day One Foundry LLC</p>
        </footer>

      </main>
    </div>
  )
}

function AppStoreBadge() {
  return (
    <a href="https://apps.apple.com/us/app/toy-group-video-cards/id6758913044" className="inline-block transition-opacity hover:opacity-70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
        alt="Download on the App Store"
        className="h-[60px] w-auto dark:invert"
      />
    </a>
  )
}

function Step({ number, title, image, children }: { number: number; title: string; image: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-12">
      <div className="flex-1">
        <span className="mb-3 block text-sm uppercase tracking-widest text-toy-text-secondary">
          Step {number}
        </span>
        <h3 className="mb-3 text-[34px] tracking-tight sm:text-[38px]">{title}</h3>
        <p className="max-w-[440px] text-[19px] leading-relaxed text-toy-text-secondary sm:text-[20px]">{children}</p>
      </div>
      <div className="w-[200px] shrink-0">
        <Image
          src={image}
          alt=""
          width={400}
          height={800}
          className="w-full h-auto"
        />
      </div>
    </li>
  )
}
