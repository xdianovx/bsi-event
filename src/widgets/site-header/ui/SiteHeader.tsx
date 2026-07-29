import NextLink from 'next/link'
import { Button, Typography } from '@heroui/react'

/**
 * Разделы, которых ещё нет, показаны неактивными, а не ссылками в никуда:
 * структуру навигации видно целиком, но клик не ведёт на 404.
 */
const NAV: { label: string; href?: string }[] = [
  { label: 'Туры', href: '/tury' },
  { label: 'Направления', href: '/napravleniya' },
  { label: 'О компании' },
  { label: 'Отзывы' },
  { label: 'Контакты' },
]

const PHONE = '+7 495 000-00-00'

export function SiteHeader() {
  return (
    // Заливкой, а не рамкой: линий в макете нет, блоки разделяет тон
    <header className="bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4 sm:px-6">
        <NextLink href="/">
          <Typography type="h5">BSI Events</Typography>
        </NextLink>

        <nav aria-label="Основная навигация" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {NAV.map((item) =>
            item.href ? (
              <NextLink key={item.label} href={item.href} className="link text-sm no-underline">
                {item.label}
              </NextLink>
            ) : (
              <Typography key={item.label} color="muted" type="body-sm" aria-disabled="true">
                {item.label}
              </Typography>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <a
            href={`tel:${PHONE.replace(/[^+\d]/g, '')}`}
            className="link hidden text-sm font-semibold no-underline sm:block"
          >
            {PHONE}
          </a>
          <Button>Оставить заявку</Button>
        </div>
      </div>
    </header>
  )
}
