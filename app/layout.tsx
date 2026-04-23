import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TeamPulse',
  description: 'Live team sentiment surveys',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-warm-50">
        {children}
      </body>
    </html>
  )
}
