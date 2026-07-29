import type { Metadata } from 'next'
import React from 'react'
import './styles.css'
import { SiteHeader } from '@/widgets/site-header'
import { SiteFooter } from '@/widgets/site-footer'

export const metadata: Metadata = {
  title: {
    default: 'BSI Events — событийные туры',
    template: '%s | BSI Events',
  },
  description: 'Туры на концерты, спортивные матчи и гонки: билеты, проживание и виза под ключ.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    // Шрифт не подключаем: у HeroUI это системный стек, он и остаётся
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-background text-foreground flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
