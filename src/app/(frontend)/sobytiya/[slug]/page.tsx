import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Typography } from '@heroui/react'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'

import config from '@/cms/payload.config'
import { getEventBySlug } from '@/entities/event'
import type { Media } from '@/payload-types'
import { formatDate, formatPlace, formatPrice } from '@/entities/event'
import { OrderPanel } from '@/features/order-builder'
import { Breadcrumbs, Page, Section } from '@/shared/ui'

type Params = Promise<{ slug: string }>

const load = async (slug: string) => {
  const payload = await getPayload({ config: await config })
  return getEventBySlug(payload, slug)
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const event = await load(slug)

  if (!event) return { title: 'Событие не найдено' }

  const place = formatPlace(event.country, event.city)

  return {
    title: event.seo?.title || event.title,
    description:
      event.seo?.description ||
      `${event.title}${place ? ` — ${place}` : ''}. Билет, проживание и виза одним заказом.`,
    alternates: { canonical: `/sobytiya/${event.slug}` },
    robots: event.seo?.noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params
  const event = await load(slug)

  // Черновик и несуществующий слаг неотличимы снаружи — оба 404
  if (!event) notFound()

  const photos = (Array.isArray(event.photos) ? event.photos : []) as Media[]
  const place = formatPlace(event.country, event.city)

  // getEventBySlug раскрывает связи depth: 2
  const category = typeof event.category === 'object' ? event.category : null

  const included = (event.included ?? [])
    .map((item) => (typeof item === 'object' ? item : null))
    .filter(Boolean) as { id: number; name: string; description?: string | null }[]

  const paidSeparately = (event.paidSeparately ?? []).map((row) => ({
    id: String(row.id),
    label: typeof row.attribute === 'object' ? row.attribute.name : 'Доп',
    price: row.price,
    note: row.note,
  }))

  const itinerary = [...(event.itinerary ?? [])].sort((a, b) => (a.day ?? 0) - (b.day ?? 0))

  return (
    <Page>
      <Breadcrumbs
        items={[{ label: 'События', href: '/sobytiya' }, { label: event.title }]}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-accent mb-3 text-sm font-semibold">
            {formatDate(event.startDate)}
            <span className="text-muted mx-2">·</span>
            {category && <span className="text-muted">{category.name}</span>}
          </p>

          <Typography.Heading className="text-balance" level={1}>
            {event.title}
          </Typography.Heading>

          {place && <p className="text-muted mt-3 text-lg">{place}</p>}

          {photos.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element -- media отдаётся Payload, next/image потребует настройки loader
                <img
                  key={photo.id}
                  src={photo.url ?? ''}
                  alt={photo.alt ?? event.title}
                  className="bg-surface-secondary w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-secondary text-muted mt-8 flex aspect-[16/9] items-center justify-center rounded-2xl text-xs tracking-widest uppercase">
              без афиши
            </div>
          )}

          {included.length > 0 && (
            <Section className="mt-12">
              <Typography.Heading level={2}>Включено</Typography.Heading>
              <ul className="flex flex-col gap-2">
                {included.map((item) => (
                  <li key={item.id} className="text-muted">
                    <span className="text-foreground font-medium">{item.name}</span>
                    {item.description ? ` — ${item.description}` : null}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {paidSeparately.length > 0 && (
            <Section className="mt-12">
              {/* Отдельной секцией, а не крестиками в общем списке: «оплачивается
                  отдельно» — это возражение, и снять его лучше на странице */}
              <Typography.Heading level={2}>Оплачивается отдельно</Typography.Heading>
              <ul className="flex flex-col gap-2">
                {paidSeparately.map((item) => (
                  <li key={item.id} className="text-muted">
                    <span className="text-foreground font-medium">{item.label}</span>
                    {' — '}
                    {formatPrice(item.price, event.currency)}
                    {item.note ? ` · ${item.note}` : null}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(event.ticketTypes ?? []).length > 0 && (
            <Section className="mt-12">
              <Typography.Heading level={2}>Категории билета</Typography.Heading>
              <ul className="flex flex-col gap-3">
                {(event.ticketTypes ?? []).map((ticket) => (
                  <li key={ticket.id} className="flex items-baseline justify-between gap-4">
                    <span>
                      <span className="font-medium">{ticket.name}</span>
                      {ticket.description ? (
                        <span className="text-muted"> — {ticket.description}</span>
                      ) : null}
                    </span>
                    <span className="text-muted shrink-0">
                      {ticket.soldOut ? 'нет мест' : formatPrice(ticket.price, event.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(event.accommodations ?? []).length > 0 && (
            <Section className="mt-12">
              <Typography.Heading level={2}>Размещение</Typography.Heading>
              <ul className="flex flex-col gap-3">
                {(event.accommodations ?? []).map((room) => (
                  <li key={room.id} className="flex items-baseline justify-between gap-4">
                    <span>
                      <span className="font-medium">
                        {room.hotelName}
                        {room.stars ? ` ${room.stars}★` : null}
                      </span>
                      <span className="text-muted">
                        {' — '}
                        {room.roomName}
                        {room.capacity ? `, до ${room.capacity} чел.` : null}
                        {room.mealPlan ? `, ${room.mealPlan}` : null}
                      </span>
                    </span>
                    <span className="text-muted shrink-0">
                      {room.soldOut ? 'нет мест' : formatPrice(room.price, event.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {itinerary.length > 0 && (
            <Section className="mt-12">
              <Typography.Heading level={2}>Программа по дням</Typography.Heading>
              <ol className="flex flex-col gap-4">
                {itinerary.map((day) => (
                  <li key={day.id}>
                    <p className="font-medium">
                      День {day.day} — {day.title}
                    </p>
                    {day.description && <p className="text-muted">{day.description}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {(event.venueName || event.address) && (
            <Section className="mt-12">
              <Typography.Heading level={2}>Где проходит</Typography.Heading>
              <p className="text-muted">
                {[event.venueName, event.address].filter(Boolean).join(', ')}
              </p>
            </Section>
          )}

          {event.description && (
            <Section className="mt-12">
              <Typography.Heading level={2}>Описание</Typography.Heading>
              <div className="flex flex-col gap-4">
                <RichText data={event.description} />
              </div>
            </Section>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          {/* Пока панель считает от цены «от»; выбор билета и номера — веха
              «Состав события. Фаза 6» */}
          <OrderPanel
            eventId={event.id}
            title={event.title}
            price={event.priceFrom ?? 0}
            currency={event.currency}
            addons={paidSeparately.map(({ id, label, price }) => ({ id, label, price }))}
          />

          {event.currency !== 'rub' && event.priceRub ? (
            <p className="text-muted mt-3 text-xs">
              Ориентировочно {formatPrice(event.priceRub, 'rub')} по курсу на сегодня.
            </p>
          ) : null}
        </aside>
      </div>
    </Page>
  )
}
