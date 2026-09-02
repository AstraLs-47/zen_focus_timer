import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Fraunces, DM_Mono } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const fraunces = Fraunces({
  variable: '--font-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['WONK', 'opsz', 'SOFT'],
})

const dmMono = DM_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'ZEN — Your Personal Focus Timer',
  description: 'A beautiful, minimal focus timer to help you build a consistent daily focus habit. Track sessions, streaks, and your progress in a calm personal space.',
  keywords: ['focus timer', 'pomodoro', 'productivity', 'deep work', 'concentration'],
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'ZEN — Your Personal Focus Timer',
    description: 'Enter a focused work session, stay focused, take a break, and build a consistent daily habit.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${fraunces.variable} ${dmMono.variable}`}
    >
      <body className="font-sans antialiased bg-[#FAF8F5] text-stone-900">
        {children}
      </body>
    </html>
  )
}
