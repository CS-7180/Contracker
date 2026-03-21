import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Contracker',
  description: 'Contract & Supplier Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
