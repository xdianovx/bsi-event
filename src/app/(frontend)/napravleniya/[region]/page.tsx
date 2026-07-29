import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { geoUrl, getRegion } from '@/entities/geo'
import { collectPopulatedGeo } from '@/entities/geo'
import { Breadcrumbs, Page, Section } from '@/shared/ui'
import { GeoTile, GeoTiles } from '@/entities/geo'

type Params = Promise<{ region: string }>

const load = async (slug: string) => {
  const payload = await getPayload({ config: await config })
  const region = await getRegion(payload, slug)
  if (!region) return null

  const [{ docs: all }, populated] = await Promise.all([
    payload.find({
      collection: 'countries',
      where: { 'region.slug': { equals: slug } },
      sort: 'name',
      limit: 300,
      depth: 1,
    }),
    collectPopulatedGeo(payload),
  ])

  // Регион без единого события — пустая страница, её быть не должно
  if (!populated.regions.has(region.id)) return null

  return { region, countries: all.filter((country) => populated.countries.has(country.id)) }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region: slug } = await params
  const data = await load(slug)

  if (!data) return { title: 'Регион не найден' }

  return {
    title: data.region.seo?.title || `События в регионе ${data.region.name}`,
    description:
      data.region.seo?.description ||
      `Страны региона ${data.region.name} и события: билет, проживание и виза одним заказом.`,
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
    <Page>
      <Section>
        <Breadcrumbs
          items={[{ label: 'Направления', href: geoUrl.regions() }, { label: region.name }]}
        />
        <Typography.Heading level={1}>{region.name}</Typography.Heading>
      </Section>

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
              code={country.code}
            />
          ))}
        </GeoTiles>
      )}
    </Page>
  )
}
