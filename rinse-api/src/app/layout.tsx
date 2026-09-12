import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { DM_Sans, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthProvider } from '@/providers/AuthProvider'
import { ActionToastProvider } from '@/providers/ActionToastProvider'
import { ConfirmProvider } from '@/providers/ConfirmProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import SetupMotionProvider from '@/providers/SetupMotionProvider'
import AppShell from '@/components/AppShell'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import './globals.css'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: 'Rinse',
  description: 'Car detailing business operations and profit tracking',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rinse',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f2f2f7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <SetupMotionProvider>
            <AuthProvider>
              <ActionToastProvider>
                <ConfirmProvider>
                  <AppShell>{children}</AppShell>
                </ConfirmProvider>
              </ActionToastProvider>
            </AuthProvider>
          </SetupMotionProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights dsn={process.env.NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS_DSN} />
      </body>
    </html>
  )
}
