import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { geoUrl, getRegion } from '@/lib/geo'
import { Breadcrumbs, GeoTile, GeoTiles } from '../GeoUI'

type Params = Promise<{ region: string }>

const load = async (slug: string) => {
  const payload = await getPayload({ config: await config })
  const region = await getRegion(payload, slug)
  if (!region) return null

  const { docs: countries } = await payload.find({
    collection: 'countries',
    where: { 'region.slug': { equals: slug } },
    sort: 'name',
    limit: 200,
    depth: 1,
  })

  return { region, countries }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region: slug } = await params
  const data = await load(slug)

  if (!data) return { title: 'Регион не найден' }

  return {
    title: data.region.seo?.title || `Туры в регион ${data.region.name}`,
    description:
      data.region.seo?.description ||
      `Страны региона ${data.region.name} и туры на события: билет, проживание и виза одним заказом.`,
    alternates: { canonical: geoUrl.region(data.region.slug) },
    robots: data.region.seo?.noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function RegionPage({ params }: { params: Params }) {
  const { region: slug } = await params
  const data = await load(slug)

  if (!data) notFound()

  const { region, countries } = data

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <Breadcrumbs
        items={[{ label: 'Направления', href: geoUrl.regions() }, { label: region.name }]}
      />

      <h1 className="mb-4 text-3xl leading-tight font-extrabold sm:text-5xl">{region.name}</h1>

      {countries.length === 0 ? (
        <p className="text-muted">В этом регионе пока нет стран.</p>
      ) : (
        <GeoTiles>
          {countries.map((country) => (
            <GeoTile
              key={country.id}
              href={geoUrl.country(region.slug, country.slug)}
              name={country.name}
              flag={country.flag}
            />
          ))}
        </GeoTiles>
      )}
    </main>
  )
}
