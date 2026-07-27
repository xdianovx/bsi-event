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

  const [{ docs: events }, { docs: countries }] = await Promise.all([
    payload.find({
      collection: 'events',
      where: { status: { equals: 'published' } },
      limit: 0,
      depth: 0,
      sort: '-updatedAt',
    }),
    payload.find({ collection: 'countries', limit: 0, depth: 0 }),
  ])

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tury`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/napravleniya`, changeFrequency: 'weekly', priority: 0.7 },
    ...countries.map((c) => ({
      url: `${SITE_URL}/napravleniya/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${SITE_URL}/tury/${e.slug}`,
      lastModified: new Date(e.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
