import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-[20vw] text-black leading-none" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>TOY</h1>
        <p className="mt-4 text-sm text-gray-400">coming soon</p>
      </div>
      <footer className="absolute bottom-8 flex gap-4 text-xs text-gray-400">
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <span>&middot;</span>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
