import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { belongsTo, geoUrl, getCountry } from '@/entities/geo'
import { collectPopulatedGeo } from '@/entities/geo'
import { buildCatalogQuery } from '@/entities/event'
import { EventCard } from '@/entities/event'
import { Breadcrumbs, Page, Section } from '@/shared/ui'
import { Flag, GeoTile, GeoTiles } from '@/entities/geo'

type Params = Promise<{ region: string; country: string }>

const load = async (regionSlug: string, countrySlug: string) => {
  const payload = await getPayload({ config: await config })
  const country = await getCountry(payload, countrySlug)

  // Адрес должен отражать реальную вложенность, иначе одна страна открывалась
  // бы под любым регионом и плодила дубли в индексе.
  if (!country || !belongsTo(country.region, regionSlug)) return null

  const [{ docs: allCities }, { docs: events }, populated] = await Promise.all([
    payload.find({
      collection: 'cities',
      where: { 'country.slug': { equals: countrySlug } },
      sort: 'name',
      limit: 300,
      depth: 0,
    }),
    payload.find({
      collection: 'events',
      ...buildCatalogQuery({ country: countrySlug }),
      depth: 2,
    }),
    collectPopulatedGeo(payload),
  ])

  if (!populated.countries.has(country.id)) return null

  return { country, cities: allCities.filter((city) => populated.cities.has(city.id)), events }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region, country: slug } = await params
  const data = await load(region, slug)

  if (!data) return { title: 'Страна не найдена' }

  return {
    title: data.country.seo?.title || `События в ${data.country.name}`,
    description:
      data.country.seo?.description ||
      `События в ${data.country.name}: билет, проживание и виза одним заказом.`,
    alternates: { canonical: geoUrl.country(region, data.country.slug) },
    robots: data.country.seo?.noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function CountryPage({ params }: { params: Params }) {
  const { region, country: slug } = await params
  const data = await load(region, slug)

  if (!data) notFound()

  const { country, cities, events } = data
  const regionName = typeof country.region === 'object' ? country.region?.name : undefined

  return (
    <Page>
      <Breadcrumbs
        items={[
          { label: 'Направления', href: geoUrl.regions() },
          { label: regionName ?? region, href: geoUrl.region(region) },
          { label: country.name },
        ]}
      />

      <Typography.Heading className="flex items-center gap-3" level={1}>
        <Flag flag={country.flag} code={country.code} name={country.name} />
        {country.name}
      </Typography.Heading>

      {cities.length > 0 && (
        <Section>
          <Typography.Heading level={2}>Города</Typography.Heading>
          <GeoTiles>
            {cities.map((city) => (
              <GeoTile
                key={city.id}
                href={geoUrl.city(region, country.slug, city.slug)}
                name={city.name}
              />
            ))}
          </GeoTiles>
        </Section>
      )}

      <Section>
        <Typography.Heading level={2}>События</Typography.Heading>
        {events.length === 0 ? (
          <p className="text-muted">
            Событий пока нет.{' '}
            <Link href="/sobytiya" className="text-accent underline underline-offset-4">
              Посмотреть все направления
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}
