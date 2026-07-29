import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

describe('Events pricing schema', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('событие с ценой и допками сохраняется и читается целиком', async () => {
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Испания ${uniq()}`, slug: `ispaniya-${uniq()}` },
    })

    const created = await payload.create({
      collection: 'events',
      data: {
        title: `Событие с допками ${uniq()}`,
        slug: `sobytie-s-dopkami-${uniq()}`,
        type: 'sport',
        country: country.id,
        price: 3000,
        currency: 'rub',
        addons: [
          { label: 'Трансфер', price: 1000, type: 'transfer' },
          { label: 'Страховка', price: 500, type: 'insurance' },
        ],
        status: 'published',
      },
    })

    const { docs } = await payload.find({
      collection: 'events',
      where: { id: { equals: created.id } },
    })

    expect(docs).toHaveLength(1)
    const doc = docs[0]
    expect(doc.price).toBe(3000)
    expect(doc.currency).toBe('rub')
    expect(doc.priceRub).toBe(3000)
    expect(doc.addons).toHaveLength(2)
    expect(doc.addons?.[0]).toMatchObject({ label: 'Трансфер', price: 1000, type: 'transfer' })
  })

  it('допки необязательны — событие может быть просто билетом', async () => {
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Италия ${uniq()}`, slug: `italia-${uniq()}` },
    })

    const created = await payload.create({
      collection: 'events',
      data: {
        title: `Событие без допок ${uniq()}`,
        slug: `sobytie-bez-dopok-${uniq()}`,
        type: 'concert',
        country: country.id,
        price: 5000,
        currency: 'rub',
        status: 'published',
      },
    })

    expect(created.addons ?? []).toHaveLength(0)
    expect(created.priceRub).toBe(5000)
  })

  it('цена обязательна: без неё событие не создаётся', async () => {
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Франция ${uniq()}`, slug: `franciya-${uniq()}` },
    })

    await expect(
      payload.create({
        collection: 'events',
        data: {
          title: `Событие без цены ${uniq()}`,
          type: 'concert',
          country: country.id,
          status: 'published',
        } as never,
      }),
    ).rejects.toThrow()
  })
})
