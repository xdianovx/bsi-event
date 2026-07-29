import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

describe('Гео-каталог: регион → страна → город', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('регион создаётся и получает слаг из названия', async () => {
    const region = await payload.create({
      collection: 'regions',
      data: { name: `Европа ${uniq()}` } as never,
    })

    expect(region.slug).toMatch(/^evropa-/)
  })

  it('страна привязывается к региону', async () => {
    const region = await payload.create({
      collection: 'regions',
      data: { name: `Азия ${uniq()}`, slug: `aziya-${uniq()}` },
    })

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Япония ${uniq()}`, slug: `yaponiya-${uniq()}`, region: region.id },
    })

    const linked = country.region
    expect(typeof linked === 'object' && linked ? linked.id : linked).toBe(region.id)
  })

  it('страны региона выбираются одним запросом по слагу региона', async () => {
    const slug = `region-${uniq()}`
    const region = await payload.create({
      collection: 'regions',
      data: { name: `Регион ${uniq()}`, slug },
    })

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Страна ${uniq()}`, slug: `strana-${uniq()}`, region: region.id },
    })

    const { docs } = await payload.find({
      collection: 'countries',
      where: { 'region.slug': { equals: slug } },
    })

    expect(docs.map((d) => d.id)).toContain(country.id)
  })

  it('город привязывается к стране', async () => {
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Италия ${uniq()}`, slug: `italia-${uniq()}` },
    })

    const city = await payload.create({
      collection: 'cities',
      data: { name: `Милан ${uniq()}`, slug: `milan-${uniq()}`, country: country.id },
    })

    expect(typeof city.country === 'object' ? city.country.id : city.country).toBe(country.id)
  })

  it('цепочка регион→страна→город читается от события одним запросом', async () => {
    const region = await payload.create({
      collection: 'regions',
      data: { name: `Европа ${uniq()}`, slug: `evropa-${uniq()}` },
    })
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Италия ${uniq()}`, slug: `italia-${uniq()}`, region: region.id },
    })
    const city = await payload.create({
      collection: 'cities',
      data: { name: `Милан ${uniq()}`, slug: `milan-${uniq()}`, country: country.id },
    })

    const event = await payload.create({
      collection: 'events',
      data: {
        title: `Событие гео ${uniq()}`,
        slug: `sobytie-geo-${uniq()}`,
        type: 'concert',
        country: country.id,
        city: city.id,
        price: 5000,
        currency: 'rub',
        status: 'published',
      } as never,
    })

    const doc = await payload.findByID({ collection: 'events', id: event.id, depth: 3 })

    const cityDoc = doc.city as { name: string; country: { name: string; region: { name: string } } }
    expect(cityDoc.name).toBe(city.name)
    expect(cityDoc.country.name).toBe(country.name)
    expect(cityDoc.country.region.name).toBe(region.name)
  })

  it('события фильтруются по слагу региона через страну — два уровня вложенности', async () => {
    const regionSlug = `region-filter-${uniq()}`
    const region = await payload.create({
      collection: 'regions',
      data: { name: `Регион ${uniq()}`, slug: regionSlug },
    })
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Страна ${uniq()}`, slug: `strana-${uniq()}`, region: region.id },
    })
    const event = await payload.create({
      collection: 'events',
      data: {
        title: `Событие региона ${uniq()}`,
        slug: `sobytie-regiona-${uniq()}`,
        type: 'concert',
        country: country.id,
        price: 2000,
        currency: 'rub',
        status: 'published',
      } as never,
    })

    const { docs } = await payload.find({
      collection: 'events',
      where: { 'country.region.slug': { equals: regionSlug } },
    })

    expect(docs.map((d) => d.id)).toEqual([event.id])
  })

  it('события фильтруются по слагу города', async () => {
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Страна ${uniq()}`, slug: `strana-${uniq()}` },
    })
    const citySlug = `gorod-${uniq()}`
    const city = await payload.create({
      collection: 'cities',
      data: { name: `Город ${uniq()}`, slug: citySlug, country: country.id },
    })
    const event = await payload.create({
      collection: 'events',
      data: {
        title: `Событие города ${uniq()}`,
        slug: `sobytie-goroda-${uniq()}`,
        type: 'sport',
        country: country.id,
        city: city.id,
        price: 1000,
        currency: 'rub',
        status: 'published',
      } as never,
    })

    const { docs } = await payload.find({
      collection: 'events',
      where: { 'city.slug': { equals: citySlug } },
    })

    expect(docs.map((d) => d.id)).toEqual([event.id])
  })
})
