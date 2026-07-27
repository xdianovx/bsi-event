import Link from 'next/link'
import type { Event, Media } from '@/payload-types'
import { formatDate, formatPrice } from './format'

const TYPE_LABELS: Record<string, string> = {
  concert: 'Концерт',
  sport: 'Спорт',
  racing: 'Гонки',
}

export function EventCard({ event }: { event: Event }) {
  const photo = Array.isArray(event.photos) ? (event.photos[0] as Media | undefined) : undefined
  const country = typeof event.country === 'object' ? event.country : undefined
  const place = [country?.name, event.city].filter(Boolean).join(', ')

  return (
    <article
      className="ticket bg-surface focus-within:ring-accent relative flex flex-col overflow-hidden rounded-2xl focus-within:ring-2"
      style={{ '--tear-y': '58%' } as React.CSSProperties}
    >
      {/* Афиша */}
      <div className="bg-surface-strong relative aspect-[4/3] overflow-hidden">
        {photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- media отдаётся Payload, next/image потребует настройки loader
          <img
            src={photo.url}
            alt={photo.alt ?? event.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted flex h-full items-center justify-center text-xs tracking-widest uppercase">
            без афиши
          </div>
        )}

        <span className="bg-background text-foreground absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] tracking-widest uppercase">
          {TYPE_LABELS[event.type] ?? event.type}
        </span>
      </div>

      {/* Корешок: дата, место, цена — как на печатном билете */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-accent text-sm font-semibold">
          {formatDate(event.startDate)}
        </p>

        <h2 className="text-base leading-snug font-semibold text-balance">
          <Link href={`/tury/${event.slug}`} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h2>

        {place && <p className="text-muted text-sm">{place}</p>}

        <p className="mt-auto text-lg font-bold">
          {formatPrice(event.price, event.currency)}
          {event.currency !== 'rub' && event.priceRub ? (
            <span className="text-muted ml-2 text-xs font-normal">
              ≈ {formatPrice(event.priceRub, 'rub')}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  )
}
