'use client'

import { Suspense } from 'react'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('min-h-screen bg-background font-sans antialiased')}>
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
        <meta
          name="description"
          content="Dashboard"
        />
        <meta name="robots" content="index, follow" />
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
