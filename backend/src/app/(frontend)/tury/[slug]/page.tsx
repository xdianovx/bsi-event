import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'

import config from '@/payload.config'
import { getEventBySlug } from '@/lib/catalog'
import type { Media } from '@/payload-types'
import { formatDate, formatPrice } from '../format'
import { OrderPanel } from './OrderPanel'

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

  if (!event) return { title: 'Тур не найден' }

  const place = [typeof event.country === 'object' ? event.country.name : null, event.city]
    .filter(Boolean)
    .join(', ')

  return {
    title: event.seo?.title || event.title,
    description:
      event.seo?.description ||
      `${event.title}${place ? ` — ${place}` : ''}. Билет, проживание и виза одним заказом.`,
    alternates: { canonical: `/tury/${event.slug}` },
    robots: event.seo?.noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params
  const event = await load(slug)

  // Черновик и несуществующий слаг неотличимы снаружи — оба 404
  if (!event) notFound()

  const photos = (Array.isArray(event.photos) ? event.photos : []) as Media[]
  const country = typeof event.country === 'object' ? event.country : undefined
  const place = [country?.name, event.city].filter(Boolean).join(', ')

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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <nav aria-label="Хлебные крошки" className="text-muted mb-8 text-sm">
        <Link href="/tury" className="hover:text-foreground underline underline-offset-4">
          Туры на события
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{event.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-accent mb-3 text-sm font-semibold">
            {formatDate(event.startDate)}
            <span className="text-muted mx-2">·</span>
            <span className="text-muted">{TYPE_LABELS[event.type] ?? event.type}</span>
          </p>

          <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
            {event.title}
          </h1>

          {place && <p className="text-muted mt-3 text-lg">{place}</p>}

          {photos.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element -- media отдаётся Payload, next/image потребует настройки loader
                <img
                  key={photo.id}
                  src={photo.url ?? ''}
                  alt={photo.alt ?? event.title}
                  className="bg-surface-strong w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-strong text-muted mt-8 flex aspect-[16/9] items-center justify-center rounded-2xl text-xs tracking-widest uppercase">
              без афиши
            </div>
          )}

          {includes.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">Что входит</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {includes.map((item) => (
                  <li key={item} className="text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {event.description && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">Описание</h2>
              <div className="mt-4 flex flex-col gap-4">
                <RichText data={event.description} />
              </div>
            </section>
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
    </main>
  )
}
