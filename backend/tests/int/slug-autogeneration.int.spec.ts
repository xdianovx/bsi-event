import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { slugify } from '../../src/lib/slugify'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('Автогенерация slug', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('countries: генерирует slug из name, если slug не передан', async () => {
    const name = `Германия автотест ${Date.now()}`
    const doc = await payload.create({
      collection: 'countries',
      data: { name },
    })
    expect(doc.slug).toBe(slugify(name))
  })

  it('countries: не перезаписывает slug, если он передан явно', async () => {
    const doc = await payload.create({
      collection: 'countries',
      data: { name: `Франция автотест ${Date.now()}`, slug: `custom-slug-${Date.now()}` },
    })
    expect(doc.slug).toMatch(/^custom-slug-/)
  })

  it('events: генерирует slug из title, если slug не передан', async () => {
    const title = `Тур с тарифами автотест ${Date.now()}`
    const country = await payload.create({
      collection: 'countries',
      data: { name: `Тестстрана ${Date.now()}`, slug: `teststrana-${Date.now()}` },
    })
    const doc = await payload.create({
      collection: 'events',
      data: { title, type: 'concert', country: country.id, pricingType: 'tariffs' },
    })
    expect(doc.slug).toBe(slugify(title))
  })
})
