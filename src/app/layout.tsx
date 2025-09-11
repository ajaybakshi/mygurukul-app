import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNavigation from '@/components/BottomNavigation'
import { ChakraProvider } from '@chakra-ui/react'

export const metadata: Metadata = {
  title: 'MyGurukul - Spiritual Q&A',
  description: 'Your spiritual journey starts here. Ask questions, find wisdom, and grow with the MyGurukul community.',
  keywords: 'spiritual, Q&A, wisdom, meditation, mindfulness, gurukul',
  authors: [{ name: 'MyGurukul Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-spiritual-50 to-spiritual-100">
        <ChakraProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-20">
              {children}
            </main>
            <BottomNavigation />
          </div>
        </ChakraProvider>
      </body>
    </html>
  )
}
