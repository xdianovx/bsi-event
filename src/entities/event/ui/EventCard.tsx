import Link from 'next/link'
import { Card, Chip, Typography } from '@heroui/react'
import type { Event, Media } from '@/payload-types'
import { formatDate, formatPlace, formatPrice } from '../lib/format'

const TYPE_LABELS: Record<string, string> = {
  concert: 'Концерт',
  sport: 'Спорт',
  racing: 'Гонки',
}

export function EventCard({ event }: { event: Event }) {
  const photo = Array.isArray(event.photos) ? (event.photos[0] as Media | undefined) : undefined
  const place = formatPlace(event.country, event.city)

  return (
    // Радиус, отступы и фон — от Card. Своё только раскладка и афиша.
    // render={...} не используем: это функция, а Card — клиентский компонент,
    // передать её из серверного нельзя.
    <Card className="h-full">
      {/* Афиша */}
      <div className="bg-surface-secondary relative aspect-[4/3] overflow-hidden rounded-2xl">
        {photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- media отдаётся Payload, next/image потребует настройки loader
          <img
            src={photo.url}
            alt={photo.alt ?? event.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Typography color="muted" type="body-xs">
              без афиши
            </Typography>
          </div>
        )}

        <Chip className="absolute top-3 left-3" size="sm">
          {TYPE_LABELS[event.type] ?? event.type}
        </Chip>
      </div>

      <Card.Header>
        <Typography className="text-accent" type="body-sm" weight="semibold">
          {formatDate(event.startDate)}
        </Typography>
        <Card.Title>
          {/* Ссылка растянута на всю карточку: кликабельна вся плитка */}
          <Link href={`/tury/${event.slug}`} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </Card.Title>
        {place && <Card.Description>{place}</Card.Description>}
      </Card.Header>

      <Card.Footer className="mt-auto items-baseline gap-2">
        <Typography type="h5">{formatPrice(event.price, event.currency)}</Typography>
        {event.currency !== 'rub' && event.priceRub ? (
          <Typography color="muted" type="body-xs">
            ≈ {formatPrice(event.priceRub, 'rub')}
          </Typography>
        ) : null}
      </Card.Footer>
    </Card>
  )
}
