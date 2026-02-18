import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'TOY - Thinking Of You',
  description: 'Group video cards for the people who matter',
  openGraph: {
    title: 'TOY - Thinking Of You',
    description: 'Group video cards for the people who matter',
    siteName: 'TOY',
  },
}

export default async function CardPage() {
  redirect('https://sendtoycard.com')
}
