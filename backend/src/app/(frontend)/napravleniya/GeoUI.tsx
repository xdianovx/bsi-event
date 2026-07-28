import Link from 'next/link'
import type { Media } from '@/payload-types'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="text-muted mb-8 text-sm">
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground underline underline-offset-4">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

/**
 * Флаг страны. Отдаём через <img>, а не инлайном: загруженный SVG может
 * содержать скрипт, и при встраивании в разметку он выполнился бы в браузере
 * посетителя от имени сайта.
 */
export function Flag({ flag, name }: { flag?: Media | number | null; name: string }) {
  if (typeof flag !== 'object' || !flag?.url) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element -- media отдаётся Payload, next/image потребует настройки loader
    <img
      src={flag.url}
      alt={`Флаг: ${name}`}
      className="h-4 w-6 shrink-0 object-cover"
      loading="lazy"
    />
  )
}

/** Плитка уровня географии — регион, страна или город. */
export function GeoTile({
  href,
  name,
  note,
  flag,
}: {
  href: string
  name: string
  note?: string
  flag?: Media | number | null
}) {
  return (
    <li>
      <Link
        href={href}
        className="bg-surface focus-visible:ring-accent flex items-center gap-3 rounded-2xl p-5 focus-visible:ring-2 focus-visible:outline-none"
      >
        <Flag flag={flag} name={name} />
        <span className="font-semibold">{name}</span>
        {note && <span className="text-muted ml-auto text-sm">{note}</span>}
      </Link>
    </li>
  )
}

export function GeoTiles({ children }: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
}
