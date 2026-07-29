import Link from 'next/link'
import { Typography } from '@heroui/react'

type Item = { label: string; href?: string }

/** Как и в шапке: несделанные разделы показаны, но не кликабельны. */
const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: 'Компания',
    items: [{ label: 'О компании' }, { label: 'Отзывы' }, { label: 'Контакты' }, { label: 'Блог' }],
  },
  {
    title: 'Поездки',
    items: [
      { label: 'Все события', href: '/sobytiya' },
      { label: 'Направления', href: '/napravleniya' },
      { label: 'Категории', href: '/kategorii' },
      { label: 'Концерты', href: '/kategorii/koncerty' },
      { label: 'Спорт', href: '/kategorii/sport' },
    ],
  },
  {
    title: 'Документы',
    items: [
      { label: 'Политика конфиденциальности' },
      { label: 'Пользовательское соглашение' },
      { label: 'Обработка cookie' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-surface mt-16">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Typography className="mb-3" type="h5">
              BSI Events
            </Typography>
            <Typography color="muted" type="body-sm">
              Поездки на концерты, матчи и гонки: билет, перелёт, отель и виза одним заказом.
            </Typography>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <Typography className="mb-3" type="h6">
                {column.title}
              </Typography>
              <ul className="space-y-2">
                {column.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href} className="link text-muted text-sm no-underline">
                        {item.label}
                      </Link>
                    ) : (
                      <Typography color="muted" type="body-sm" aria-disabled="true">
                        {item.label}
                      </Typography>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Typography className="mt-10" color="muted" type="body-sm">
          © {new Date().getFullYear()} BSI Events. Не является публичной офертой.
        </Typography>
      </div>
    </footer>
  )
}
