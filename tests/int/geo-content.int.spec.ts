import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { ensureCategory } from '../helpers/category'
import { describe, it, beforeAll, expect } from 'vitest'
import { collectPopulatedGeo } from '@/entities/geo'

let payload: Payload
let categoryId: number

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

let filled = { region: 0, country: 0, city: 0 }
let empty = { region: 0, country: 0, city: 0 }
let draftOnly = { country: 0, city: 0 }

describe('Гео с контентом', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    categoryId = await ensureCategory(payload)

    const mkGeo = async (tag: string) => {
      const region = await payload.create({
        collection: 'regions',
        data: { name: `Регион ${tag}`, slug: `region-${tag}` },
      })
      const country = await payload.create({
        collection: 'countries',
        data: { name: `Страна ${tag}`, slug: `strana-${tag}`, region: region.id },
      })
      const city = await payload.create({
        collection: 'cities',
        data: { name: `Город ${tag}`, slug: `gorod-${tag}`, country: country.id },
      })
      return { region: region.id, country: country.id, city: city.id }
    }

    filled = await mkGeo(`full-${uniq()}`)
    empty = await mkGeo(`empty-${uniq()}`)
    const drafted = await mkGeo(`draft-${uniq()}`)
    draftOnly = { country: drafted.country, city: drafted.city }

    await payload.create({
      collection: 'events',
      data: {
        title: `Событие с контентом ${uniq()}`,
        slug: `sobytie-full-${uniq()}`,
        category: categoryId,
        country: filled.country,
        city: filled.city,
        basePrice: 1000,
        currency: 'rub',
        status: 'published',
      } as never,
    })

    await payload.create({
      collection: 'events',
      data: {
        title: `Черновик ${uniq()}`,
        slug: `sobytie-draft-${uniq()}`,
        category: categoryId,
        country: drafted.country,
        city: drafted.city,
        basePrice: 1000,
        currency: 'rub',
        status: 'draft',
      } as never,
    })
  })

  it('отмечает регион, страну и город, где есть опубликованное событие', async () => {
    const geo = await collectPopulatedGeo(payload)

    expect(geo.regions.has(filled.region)).toBe(true)
    expect(geo.countries.has(filled.country)).toBe(true)
    expect(geo.cities.has(filled.city)).toBe(true)
  })

  it('не отмечает географию без событий', async () => {
    const geo = await collectPopulatedGeo(payload)

    expect(geo.regions.has(empty.region)).toBe(false)
    expect(geo.countries.has(empty.country)).toBe(false)
    expect(geo.cities.has(empty.city)).toBe(false)
  })

  it('считает, сколько событий в стране', async () => {
    const geo = await collectPopulatedGeo(payload)

    expect(geo.eventsByCountry.get(filled.country)).toBe(1)
    expect(geo.eventsByCountry.get(empty.country)).toBeUndefined()
  })

  it('черновик контентом не считается', async () => {
    const geo = await collectPopulatedGeo(payload)

    expect(geo.countries.has(draftOnly.country)).toBe(false)
    expect(geo.cities.has(draftOnly.city)).toBe(false)
  })
})
