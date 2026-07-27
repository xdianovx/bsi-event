import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

import { buildCatalogQuery } from '@/lib/catalog'
import { getEventBySlug } from '@/lib/catalog'

let payload: Payload
let countryId: number

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

/** Событие с обязательным минимумом полей; остальное — из аргументов. */
const makeEvent = async (data: Record<string, unknown>) =>
  payload.create({
    collection: 'events',
    data: {
      title: `Событие ${uniq()}`,
      type: 'concert',
      country: countryId,
      price: 5000,
      currency: 'rub',
      status: 'published',
      ...data,
    } as never,
  })

describe('Каталог: цена, валюта, выдача', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Тестстрана ${uniq()}`, slug: `teststrana-${uniq()}` },
    })
    countryId = country.id

    await payload.updateGlobal({
      slug: 'settings',
      data: { rates: { usd: 100, eur: 110 }, markupPercent: 0 },
    })
  })

  it('рублёвой цене priceRub равен цене', async () => {
    const doc = await makeEvent({ price: 7000, currency: 'rub' })

    expect(doc.priceRub).toBe(7000)
  })

  it('валютную цену пересчитывает в рубли по курсу из настроек', async () => {
    const doc = await makeEvent({ price: 300, currency: 'usd' })

    expect(doc.priceRub).toBe(30000)
  })

  it('наценка из настроек попадает в priceRub', async () => {
    await payload.updateGlobal({
      slug: 'settings',
      data: { rates: { usd: 100, eur: 110 }, markupPercent: 10 },
    })

    const doc = await makeEvent({ price: 300, currency: 'usd' })

    expect(doc.priceRub).toBe(33000)

    await payload.updateGlobal({
      slug: 'settings',
      data: { rates: { usd: 100, eur: 110 }, markupPercent: 0 },
    })
  })

  it('смена курса пересчитывает priceRub у уже сохранённых событий', async () => {
    const created = await makeEvent({ price: 200, currency: 'usd' })
    expect(created.priceRub).toBe(20000)

    await payload.updateGlobal({
      slug: 'settings',
      data: { rates: { usd: 150, eur: 110 }, markupPercent: 0 },
    })

    const after = await payload.findByID({ collection: 'events', id: created.id })
    expect(after.priceRub).toBe(30000)

    await payload.updateGlobal({
      slug: 'settings',
      data: { rates: { usd: 100, eur: 110 }, markupPercent: 0 },
    })
  })

  it('черновик не попадает в выдачу каталога', async () => {
    const draft = await makeEvent({ status: 'draft' })

    const { docs } = await payload.find({
      collection: 'events',
      ...buildCatalogQuery({}),
      limit: 0,
    })

    expect(docs.map((d) => d.id)).not.toContain(draft.id)
  })

  it('сортировка по цене сравнивает валюты честно, а не по сырому числу', async () => {
    const slug = `sort-${uniq()}`
    const cheapUsd = await makeEvent({ price: 100, currency: 'usd', slug: `${slug}-usd` }) // 10 000 ₽
    const pricyRub = await makeEvent({ price: 50000, currency: 'rub', slug: `${slug}-rub` }) // 50 000 ₽

    const { docs } = await payload.find({
      collection: 'events',
      ...buildCatalogQuery({ sort: 'price' }),
      limit: 0,
    })

    const ids = docs.map((d) => d.id)
    expect(ids.indexOf(cheapUsd.id)).toBeLessThan(ids.indexOf(pricyRub.id))
  })

  it('фильтр по цене отбирает по рублёвому эквиваленту', async () => {
    const expensive = await makeEvent({ price: 900, currency: 'usd' }) // 90 000 ₽

    const { docs } = await payload.find({
      collection: 'events',
      ...buildCatalogQuery({ maxPrice: '50000' }),
      limit: 0,
    })

    expect(docs.map((d) => d.id)).not.toContain(expensive.id)
  })

  it('карточка по слагу отдаёт событие с раскрытой страной', async () => {
    const slug = `karta-${uniq()}`
    await makeEvent({ slug, price: 1234, currency: 'rub' })

    const doc = await getEventBySlug(payload, slug)

    expect(doc?.price).toBe(1234)
    expect(doc?.country).toMatchObject({ id: countryId })
  })

  it('карточка не отдаёт черновик', async () => {
    const slug = `chernovik-${uniq()}`
    await makeEvent({ slug, status: 'draft' })

    expect(await getEventBySlug(payload, slug)).toBeNull()
  })

  it('несуществующий слаг — null, а не исключение', async () => {
    expect(await getEventBySlug(payload, 'net-takogo-slaga')).toBeNull()
  })
})
