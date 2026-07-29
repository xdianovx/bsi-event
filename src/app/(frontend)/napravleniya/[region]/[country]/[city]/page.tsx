import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { belongsTo, geoUrl, getCity } from '@/entities/geo'
import { buildCatalogQuery } from '@/entities/event'
import { EventCard } from '@/entities/event'
import { Breadcrumbs, Page } from '@/shared/ui'

type Params = Promise<{ region: string; country: string; city: string }>

const load = async (regionSlug: string, countrySlug: string, citySlug: string) => {
  const payload = await getPayload({ config: await config })
  const city = await getCity(payload, citySlug)

  if (!city || !belongsTo(city.country, countrySlug)) return null

  // Регион проверяем через страну — цепочка должна сходиться целиком
  const country = typeof city.country === 'object' ? city.country : null
  if (!country || !belongsTo(country.region, regionSlug)) return null

  const { docs: events } = await payload.find({
    collection: 'events',
    ...buildCatalogQuery({ city: citySlug }),
    depth: 2,
  })

  // Город без туров — пустая страница. Справочник заполнен целиком, так что
  // без этой проверки в индекс ушли бы сотни городов, где показывать нечего.
  if (events.length === 0) return null

  return { city, country, events }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region, country, city: slug } = await params
  const data = await load(region, country, slug)

  if (!data) return { title: 'Город не найден' }

  return {
    title: data.city.seo?.title || `Туры в ${data.city.name}`,
    description:
      data.city.seo?.description ||
      `Туры на события в городе ${data.city.name}: билет, проживание и виза одним заказом.`,
    alternates: { canonical: geoUrl.city(region, country, data.city.slug) },
    robots: data.city.seo?.noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function CityPage({ params }: { params: Params }) {
  const { region, country: countrySlug, city: slug } = await params
  const data = await load(region, countrySlug, slug)

  if (!data) notFound()

  const { city, country, events } = data
  const regionName = typeof country.region === 'object' ? country.region?.name : undefined

  return (
    <Page>
      <Breadcrumbs
        items={[
          { label: 'Направления', href: geoUrl.regions() },
          { label: regionName ?? region, href: geoUrl.region(region) },
          { label: country.name, href: geoUrl.country(region, country.slug) },
          { label: city.name },
        ]}
      />

      <Typography.Heading level={1}>{city.name}</Typography.Heading>

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </Page>
  )
}
