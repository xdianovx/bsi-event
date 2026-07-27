import type { Metadata } from 'next'
import React from 'react'
import './styles.css'
import { body, display, mono } from './fonts'

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
    // dark + data-theme — так HeroUI переключает свои токены; без этого его
    // контролы остаются светлыми на тёмной странице
    <html
      lang="ru"
      className={`dark ${display.variable} ${body.variable} ${mono.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-screen antialiased">{children}</body>
    </html>
  )
}
