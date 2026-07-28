import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { belongsTo, geoUrl, getCountry } from '@/lib/geo'
import { buildCatalogQuery } from '@/lib/catalog'
import { EventCard } from '../../../tury/EventCard'
import { Breadcrumbs, Flag, GeoTile, GeoTiles } from '../../GeoUI'

type Params = Promise<{ region: string; country: string }>

const load = async (regionSlug: string, countrySlug: string) => {
  const payload = await getPayload({ config: await config })
  const country = await getCountry(payload, countrySlug)

  // Адрес должен отражать реальную вложенность, иначе одна страна открывалась
  // бы под любым регионом и плодила дубли в индексе.
  if (!country || !belongsTo(country.region, regionSlug)) return null

  const [{ docs: cities }, { docs: events }] = await Promise.all([
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
  ])

  return { country, cities, events }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region, country: slug } = await params
  const data = await load(region, slug)

  if (!data) return { title: 'Страна не найдена' }

  return {
    title: data.country.seo?.title || `Туры в ${data.country.name}`,
    description:
      data.country.seo?.description ||
      `Туры на события в ${data.country.name}: билет, проживание и виза одним заказом.`,
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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <Breadcrumbs
        items={[
          { label: 'Направления', href: geoUrl.regions() },
          { label: regionName ?? region, href: geoUrl.region(region) },
          { label: country.name },
        ]}
      />

      <h1 className="mb-8 flex items-center gap-3 text-3xl leading-tight font-extrabold sm:text-5xl">
        <Flag flag={country.flag} name={country.name} />
        {country.name}
      </h1>

      {cities.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">Города</h2>
          <GeoTiles>
            {cities.map((city) => (
              <GeoTile
                key={city.id}
                href={geoUrl.city(region, country.slug, city.slug)}
                name={city.name}
              />
            ))}
          </GeoTiles>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">Туры</h2>
        {events.length === 0 ? (
          <p className="text-muted">
            Туров пока нет.{' '}
            <Link href="/tury" className="text-accent underline underline-offset-4">
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
      </section>
    </main>
  )
}
