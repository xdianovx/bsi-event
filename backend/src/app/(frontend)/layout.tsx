import type { Metadata } from 'next'
import React from 'react'
import './styles.css'
import { body } from './fonts'

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
    <html lang="ru" className={body.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased">{children}</body>
    </html>
  )
}
