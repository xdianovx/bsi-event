import type { Metadata } from 'next'
import Link from 'next/link'
import { Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { EventCard, buildCatalogQuery } from '@/entities/event'
import { collectLeadStats } from '@/entities/lead'
import { collectPopulatedGeo } from '@/entities/geo'
import { Page, Section } from '@/shared/ui'
import { HomeHero } from '@/widgets/home-hero'
import { TrustBar } from '@/widgets/trust-bar'
import { HowItWorks } from '@/widgets/how-it-works'
import { WhyUs } from '@/widgets/why-us'
import { Faq } from '@/widgets/faq'
import { LeadCta } from '@/widgets/lead-cta'
import type { Event } from '@/payload-types'

export const metadata: Metadata = {
  title: 'BSI Events — поездки на концерты, матчи и гонки вместе с визой',
  description:
    'События за рубежом под ключ: билет на событие, перелёт, отель, страховка и оформление визы одним заказом.',
  alternates: { canonical: '/' },
}

const HOME_LIMIT = 6

const load = async () => {
  const payload = await getPayload({ config: await config })

  const [{ docs: upcoming }, stats, populated, regionDocs, countryDocs, cityDocs, categoryDocs] =
    await Promise.all([
      payload.find({ collection: 'events', ...buildCatalogQuery({}), limit: HOME_LIMIT, depth: 2 }),
      collectLeadStats(payload, HOME_LIMIT),
      collectPopulatedGeo(payload),
      payload.find({ collection: 'regions', sort: 'name', limit: 100, depth: 0 }),
      payload.find({ collection: 'countries', sort: 'name', limit: 500, depth: 0 }),
      payload.find({ collection: 'cities', sort: 'name', limit: 500, depth: 0 }),
      payload.find({ collection: 'categories', limit: 0, depth: 0 }),
    ])

  // «Популярное» считаем по числу заявок — это единственный честный сигнал
  // спроса, который у нас есть. Ставить хиты флажком в админке значит выдавать
  // мнение редактора за поведение покупателей.
  const popularIds = stats.topEvents.map((e) => e.id)
  const popularDocs = popularIds.length
    ? (
        await payload.find({
          collection: 'events',
          where: { id: { in: popularIds }, status: { equals: 'published' } },
          limit: HOME_LIMIT,
          depth: 2,
        })
      ).docs
    : []

  // Порядок берём из статистики, а не из базы
  const popular = popularIds
    .map((id) => popularDocs.find((doc) => doc.id === id))
    .filter((doc): doc is Event => Boolean(doc))

  const options = (docs: { name: string; slug: string }[]) =>
    docs.map(({ name, slug }) => ({ name, slug }))

  return {
    upcoming,
    // Одно событие в двух блоках подряд читается как ошибка вёрстки
    popular: popular.filter((doc) => !upcoming.some((u) => u.id === doc.id)),
    regions: options(regionDocs.docs.filter((r) => populated.regions.has(r.id))),
    countries: options(countryDocs.docs.filter((c) => populated.countries.has(c.id))),
    cities: options(cityDocs.docs.filter((c) => populated.cities.has(c.id))),
    categories: options(categoryDocs.docs),
  }
}

const EventGrid = ({ events }: { events: Event[] }) => (
  <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {events.map((event) => (
      <li key={event.id}>
        <EventCard event={event} />
      </li>
    ))}
  </ul>
)

export default async function HomePage() {
  const { upcoming, popular, regions, countries, cities, categories } = await load()

  return (
    <Page>
      <HomeHero
        regions={regions}
        countries={countries}
        cities={cities}
        categories={categories}
      />

      <TrustBar />

      {upcoming.length > 0 && (
        <Section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Typography.Heading level={2}>Ближайшие поездки</Typography.Heading>
            <Link href="/sobytiya" className="link">
              Весь каталог
            </Link>
          </div>
          <EventGrid events={upcoming} />
        </Section>
      )}

      {popular.length > 0 && (
        <Section>
          <Typography.Heading level={2}>Чаще всего спрашивают</Typography.Heading>
          <Typography color="muted">
            События, по которым к нам приходит больше всего заявок.
          </Typography>
          <EventGrid events={popular} />
        </Section>
      )}

      <Section>
        <Typography.Heading level={2}>Как это работает</Typography.Heading>
        <HowItWorks />
      </Section>

      <Section>
        <Typography.Heading level={2}>Почему через нас, а не самому</Typography.Heading>
        <WhyUs />
      </Section>

      <Section>
        <Typography.Heading level={2}>Частые вопросы</Typography.Heading>
        <Faq />
      </Section>

      <LeadCta />
    </Page>
  )
}
