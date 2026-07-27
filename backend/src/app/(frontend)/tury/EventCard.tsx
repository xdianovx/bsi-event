import Link from 'next/link'
import type { Event, Media } from '@/payload-types'

const TYPE_LABELS: Record<string, string> = {
  concert: 'Концерт',
  sport: 'Спорт',
  racing: 'Гонки',
}

const CURRENCY_SIGNS: Record<string, string> = {
  rub: '₽',
  usd: '$',
  eur: '€',
}

const formatPrice = (value: number, currency: string) =>
  `${new Intl.NumberFormat('ru-RU').format(value)} ${CURRENCY_SIGNS[currency] ?? ''}`.trim()

/**
 * «12 сент 2026» — как печать на билете. Части собираем вручную: ru-RU
 * добавляет к году «г.», а точку к месяцу — на корешке это лишний шум.
 */
const formatDate = (iso?: string | null) => {
  if (!iso) return 'дата уточняется'

  const d = new Date(iso)
  const month = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d).replace('.', '')
  const day = String(d.getDate()).padStart(2, '0')

  return `${day} ${month} ${d.getFullYear()}`
}

export function EventCard({ event }: { event: Event }) {
  const photo = Array.isArray(event.photos) ? (event.photos[0] as Media | undefined) : undefined
  const country = typeof event.country === 'object' ? event.country : undefined
  const place = [country?.name, event.city].filter(Boolean).join(', ')

  return (
    <article
      className="ticket group bg-surface border-line focus-within:ring-accent relative flex flex-col overflow-hidden rounded-2xl border transition-transform focus-within:ring-2 hover:-translate-y-1"
      style={{ '--tear-y': '58%' } as React.CSSProperties}
    >
      {/* Афиша */}
      <div className="bg-line/50 relative aspect-[4/3] overflow-hidden">
        {photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- media отдаётся Payload, next/image потребует настройки loader
          <img
            src={photo.url}
            alt={photo.alt ?? event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="text-muted flex h-full items-center justify-center text-xs tracking-widest uppercase">
            без афиши
          </div>
        )}

        <span className="bg-background/90 text-foreground border-line absolute top-3 left-3 rounded-full border px-3 py-1 text-[11px] tracking-widest uppercase backdrop-blur">
          {TYPE_LABELS[event.type] ?? event.type}
        </span>
      </div>

      {/* Корешок: дата, место, цена — как на печатном билете */}
      <div className="ticket__tear flex flex-1 flex-col gap-3 p-5">
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
