'use client'

import { Suspense } from 'react'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { PwaRegister } from '@/components/PwaRegister'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('min-h-screen bg-background font-sans antialiased')}>
      {/* registra o service worker do PWA */}
      <PwaRegister />
      {children}
      <Toaster />
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Eqp Dashboard</title>
        <meta name="description" content="Dashboard" />
        <meta name="robots" content="index, follow" />

        {/* PWA / manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#050505" />

        {/* iOS support (parecer app também no iPhone) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Eqp Dashboard" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>

      <body className={cn('overflow-y-scroll font-sans', inter.variable)}>
        <CartProvider>
          <Suspense fallback={null}>
            <LayoutContent>{children}</LayoutContent>
          </Suspense>
        </CartProvider>
      </body>
    </html>
  )
}
