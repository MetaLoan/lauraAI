import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientWrapper } from '@/components/client-wrapper'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'LauraAI | Sovereign Intelligence',
  description: 'The first Intent-based AI Asset Management. Deepen your bond, automate your wealth.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://laura-ai.com'),
  openGraph: {
    title: 'LauraAI: The Sovereign AI Protocol',
    description: 'Autonomous Intelligence meets DeFi. Mint your soulmate, secure your future.',
    url: 'https://laura-ai.com',
    siteName: 'LauraAI',
    images: [
      {
        url: '/og-image.png', // We'll need to ensure this or a good placeholder exists
        width: 1200,
        height: 630,
        alt: 'LauraAI - AI Soulmate Experience',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LauraAI | Sovereign AI Soulmate',
    description: 'The world\'s first Intent-based AI Asset Management Companion on BSC.',
    creator: '@LauraAI_BSC',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LauraAI',
  },
  icons: {
    icon: '/logolaura.png',
    apple: '/logolaura.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`font-sans antialiased bg-black text-white h-full overflow-x-hidden`}>
        {/* Liquid Glass SVG lens filter */}
        <svg xmlns="http://www.w3.org/2000/svg" role="presentation" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <filter id="lensFilter" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
              <feComponentTransfer in="SourceAlpha" result="alpha">
                <feFuncA type="identity" />
              </feComponentTransfer>
              <feGaussianBlur in="alpha" stdDeviation="50" result="blur" />
              <feDisplacementMap in="SourceGraphic" in2="blur" scale="50" xChannelSelector="A" yChannelSelector="A" />
            </filter>
          </defs>
        </svg>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  )
}
