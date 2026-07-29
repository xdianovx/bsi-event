import type { Payload } from 'payload'
import type { City, Country, Region } from '@/payload-types'

/** Уровень гео-навигации: регион → страна → город. */
export type GeoLevel = 'region' | 'country' | 'city'

const bySlug = async <T>(payload: Payload, collection: 'regions' | 'countries' | 'cities', slug: string, depth = 0) => {
  const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth })
  return (docs[0] as T | undefined) ?? null
}

export const getRegion = (payload: Payload, slug: string) =>
  bySlug<Region>(payload, 'regions', slug)

export const getCountry = (payload: Payload, slug: string) =>
  bySlug<Country>(payload, 'countries', slug, 2)

export const getCity = (payload: Payload, slug: string) =>
  bySlug<City>(payload, 'cities', slug, 3)

/**
 * Проверяет, что адрес отражает реальную вложенность: страна лежит в этом
 * регионе, город — в этой стране. Без проверки один и тот же документ
 * открывался бы по любому пути, плодя дубли в индексе.
 */
export const belongsTo = (child: { slug?: string } | number | null | undefined, parentSlug: string) =>
  typeof child === 'object' && child !== null && child.slug === parentSlug

export const geoUrl = {
  regions: () => '/napravleniya',
  region: (region: string) => `/napravleniya/${region}`,
  country: (region: string, country: string) => `/napravleniya/${region}/${country}`,
  city: (region: string, country: string, city: string) =>
    `/napravleniya/${region}/${country}/${city}`,
}
