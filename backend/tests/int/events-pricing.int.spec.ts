import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('Events pricing schema', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('creates and finds an event with pricingType=tariffs', async () => {
    const country = await payload.create({
      collection: 'countries',
      data: { name: 'Италия', slug: `italia-${Date.now()}` },
    })

    const created = await payload.create({
      collection: 'events',
      data: {
        title: 'Событие с тарифами',
        slug: `sobytie-s-tarifami-${Date.now()}`,
        type: 'concert',
        country: country.id,
        pricingType: 'tariffs',
        tariffs: [
          { title: 'Только билет', price: 5000, includes: [{ item: 'Билет на событие' }] },
          { title: 'Билет + отель', price: 15000, includes: [{ item: 'Билет' }, { item: 'Отель' }] },
        ],
      },
    })

    const { docs } = await payload.find({
      collection: 'events',
      where: { id: { equals: created.id } },
    })

    expect(docs).toHaveLength(1)
    const doc = docs[0]
    expect(doc.pricingType).toBe('tariffs')
    expect(doc.tariffs).toHaveLength(2)
    expect(doc.tariffs?.[0]).toMatchObject({ title: 'Только билет', price: 5000 })
    expect(doc.tariffs?.[0].includes).toEqual([{ item: 'Билет на событие', id: expect.any(String) }])
    expect(doc.addons ?? []).toHaveLength(0)
  })

  it('creates and finds an event with pricingType=base+addons', async () => {
    const country = await payload.create({
      collection: 'countries',
      data: { name: 'Испания', slug: `ispaniya-${Date.now()}` },
    })

    const created = await payload.create({
      collection: 'events',
      data: {
        title: 'Событие с допками',
        slug: `sobytie-s-dopkami-${Date.now()}`,
        type: 'sport',
        country: country.id,
        pricingType: 'base+addons',
        basePrice: 3000,
        addons: [
          { label: 'Трансфер', price: 1000, type: 'transfer' },
          { label: 'Страховка', price: 500, type: 'insurance' },
        ],
      },
    })

    const { docs } = await payload.find({
      collection: 'events',
      where: { id: { equals: created.id } },
    })

    expect(docs).toHaveLength(1)
    const doc = docs[0]
    expect(doc.pricingType).toBe('base+addons')
    expect(doc.basePrice).toBe(3000)
    expect(doc.addons).toHaveLength(2)
    expect(doc.addons?.[0]).toMatchObject({ label: 'Трансфер', price: 1000, type: 'transfer' })
    expect(doc.tariffs ?? []).toHaveLength(0)
  })
})
