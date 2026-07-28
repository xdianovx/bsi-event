import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Фильтры каталога в sitemap не попадают: /tury?country=... — это тот же
 * каталог под другим срезом, в generateMetadata он закрыт noindex.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: await config })

  const [{ docs: events }, { docs: regions }, { docs: countries }, { docs: cities }] = await Promise.all([
    payload.find({
      collection: 'events',
      where: { status: { equals: 'published' } },
      limit: 0,
      depth: 0,
      sort: '-updatedAt',
    }),
    payload.find({ collection: 'regions', limit: 0, depth: 0 }),
    // depth: 1 — нужен слаг региона, чтобы собрать вложенный адрес
    payload.find({ collection: 'countries', limit: 0, depth: 1 }),
    payload.find({ collection: 'cities', limit: 0, depth: 2 }),
  ])

  const regionSlug = (country: (typeof countries)[number]) =>
    typeof country.region === 'object' ? country.region?.slug : undefined

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tury`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/napravleniya`, changeFrequency: 'weekly', priority: 0.7 },
    ...regions.map((r) => ({
      url: `${SITE_URL}/napravleniya/${r.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // Страна и город попадают в карту только с полным путём: без региона
    // адрес не существует, ссылаться на него нельзя.
    ...countries
      .filter((c) => regionSlug(c))
      .map((c) => ({
        url: `${SITE_URL}/napravleniya/${regionSlug(c)}/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ...cities.flatMap((city) => {
      const country = typeof city.country === 'object' ? city.country : null
      const region = country && typeof country.region === 'object' ? country.region : null
      if (!country || !region) return []

      return [
        {
          url: `${SITE_URL}/napravleniya/${region.slug}/${country.slug}/${city.slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        },
      ]
    }),
    ...events.map((e) => ({
      url: `${SITE_URL}/tury/${e.slug}`,
      lastModified: new Date(e.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
