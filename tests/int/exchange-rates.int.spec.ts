import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { ensureCategory } from '../helpers/category'
import { addRate, clearRates, setRate } from '../helpers/rates'

import { describe, it, beforeAll, beforeEach, expect } from 'vitest'

let payload: Payload
let categoryId: number
let countryId: number

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`).toISOString()

const createEvent = async (price: number, currency: 'rub' | 'usd' | 'eur') =>
  payload.create({
    collection: 'events',
    data: {
      title: `Событие ${uniq()}`,
      slug: `sobytie-${uniq()}`,
      category: categoryId,
      country: countryId,
      price,
      currency,
      status: 'published',
    },
  })

describe('Курсы валют', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    categoryId = await ensureCategory(payload)

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Курсовая страна ${uniq()}`, slug: `kursovaya-strana-${uniq()}` },
    })
    countryId = country.id
  })

  // Тестовая база живёт между прогонами: без сброса курс от прошлого теста
  // оказался бы «последним известным» и ломал бы расчёт в следующем.
  beforeEach(async () => {
    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 0 } })
    await clearRates(payload, 'usd')
    await clearRates(payload, 'eur')
  })

  it('история хранится списком и отдаётся свежей записью вперёд', async () => {
    await addRate(payload, 'usd', 70, '2026-01-10')
    await addRate(payload, 'usd', 80, '2026-01-11')

    const { docs } = await payload.find({
      collection: 'exchangeRates',
      where: { currency: { equals: 'usd' } },
      sort: '-date',
      limit: 2,
    })

    expect(docs[0]?.rate).toBe(80)
    expect(docs[1]?.rate).toBe(70)
  })

  it('запись за тот же день обновляется, а не дублируется', async () => {
    const created = await addRate(payload, 'eur', 90, '2026-02-01')
    await payload.update({ collection: 'exchangeRates', id: created.id, data: { rate: 95 } })

    const { totalDocs, docs } = await payload.find({
      collection: 'exchangeRates',
      where: { and: [{ currency: { equals: 'eur' } }, { date: { equals: day('2026-02-01') } }] },
    })

    expect(totalDocs).toBe(1)
    expect(docs[0]?.rate).toBe(95)
  })

  it('дата нормализуется до полуночи UTC: время из датапикера уникальность не ломает', async () => {
    const created = await payload.create({
      collection: 'exchangeRates',
      data: { date: '2026-03-05T17:42:13.000Z', currency: 'usd', rate: 77, source: 'manual' },
    })

    expect(created.date).toBe(day('2026-03-05'))

    // Тот же день другим временем — уникальный индекс (дата, валюта) не пускает дубль.
    await expect(
      payload.create({
        collection: 'exchangeRates',
        data: { date: '2026-03-05T09:00:00.000Z', currency: 'usd', rate: 78, source: 'manual' },
      }),
    ).rejects.toThrow()
  })

  it('цена события считается по последнему известному курсу', async () => {
    await setRate(payload, 'usd', 100)

    const event = await createEvent(300, 'usd')
    expect(event.priceRub).toBe(30000)
  })

  it('новый курс пересчитывает цены валютных событий', async () => {
    await setRate(payload, 'usd', 100, '2026-05-01')
    const event = await createEvent(200, 'usd')
    expect(event.priceRub).toBe(20000)

    await addRate(payload, 'usd', 120, '2026-05-02')

    const updated = await payload.findByID({ collection: 'events', id: event.id })
    expect(updated.priceRub).toBe(24000)
  }, 60_000)

  it('рублёвое событие курс не трогает', async () => {
    const event = await createEvent(5000, 'rub')
    await setRate(payload, 'usd', 150)

    const updated = await payload.findByID({ collection: 'events', id: event.id })
    expect(updated.priceRub).toBe(5000)
  }, 60_000)

  it('смена наценки пересчитывает цены', async () => {
    await setRate(payload, 'eur', 100)
    const event = await createEvent(100, 'eur')
    expect(event.priceRub).toBe(10000)

    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 10 } })

    const updated = await payload.findByID({ collection: 'events', id: event.id })
    expect(updated.priceRub).toBe(11000)
  }, 60_000)

  it('ручная запись используется наравне с загруженной из ЦБ', async () => {
    await setRate(payload, 'eur', 100, '2026-08-01')
    await payload.create({
      collection: 'exchangeRates',
      data: { date: day('2026-08-02'), currency: 'eur', rate: 111, source: 'manual' },
    })

    const event = await createEvent(10, 'eur')
    expect(event.priceRub).toBe(1110)
  }, 60_000)
})
