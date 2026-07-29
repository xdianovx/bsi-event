import type { Payload } from 'payload'

/** Идентификаторы географии, у которой есть хотя бы одно опубликованное событие. */
export type PopulatedGeo = {
  regions: Set<number>
  countries: Set<number>
  cities: Set<number>
  /** Сколько опубликованных туров в стране — для подписей в списках. */
  eventsByCountry: Map<number, number>
}

const idOf = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return null
}

/**
 * Отвечает на вопрос «есть ли тут что показывать». Страна или город без
 * событий — пустая страница: посетителю она бесполезна, а поисковику это
 * сигнал низкого качества, который бьёт по всему домену, а не только по ней.
 *
 * Регион считается наполненным, если наполнена хотя бы одна его страна:
 * иначе страна оказалась бы недостижима по своему же адресу.
 */
export const collectPopulatedGeo = async (payload: Payload): Promise<PopulatedGeo> => {
  const { docs: events } = await payload.find({
    collection: 'events',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })

  const countries = new Set<number>()
  const cities = new Set<number>()
  const eventsByCountry = new Map<number, number>()

  for (const event of events) {
    const country = idOf(event.country)
    const city = idOf(event.city)
    if (country) {
      countries.add(country)
      eventsByCountry.set(country, (eventsByCountry.get(country) ?? 0) + 1)
    }
    if (city) cities.add(city)
  }

  const regions = new Set<number>()

  if (countries.size > 0) {
    const { docs } = await payload.find({
      collection: 'countries',
      where: { id: { in: [...countries] } },
      limit: 0,
      depth: 0,
    })

    for (const country of docs) {
      const region = idOf(country.region)
      if (region) regions.add(region)
    }
  }

  return { regions, countries, cities, eventsByCountry }
}
