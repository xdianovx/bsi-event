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

const TYPE_LABELS: Record<string, string> = {
  concert: 'Концерт',
  sport: 'Спорт',
  racing: 'Гонки',
}

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

  const includes = [
    event.includes?.ticket && 'Билет на событие',
    event.includes?.visa && 'Виза',
    event.includes?.accommodation && 'Проживание',
    ...(event.includes?.extra ?? []).map((e) => e.item).filter(Boolean),
  ].filter(Boolean) as string[]

  const addons = (event.addons ?? []).map((a) => ({
    id: String(a.id),
    label: a.label,
    price: a.price,
  }))

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
            <span className="text-muted">{TYPE_LABELS[event.type] ?? event.type}</span>
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

          {includes.length > 0 && (
            <Section className="mt-12">
              <Typography.Heading level={2}>Что входит</Typography.Heading>
              <ul className="flex flex-col gap-2">
                {includes.map((item) => (
                  <li key={item} className="text-muted">
                    {item}
                  </li>
                ))}
              </ul>
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
          <OrderPanel
            eventId={event.id}
            title={event.title}
            price={event.price}
            currency={event.currency}
            addons={addons}
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
