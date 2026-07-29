import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { ensureCategory } from '../helpers/category'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload
let categoryId: number
let eventId: number

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

describe('Заявка сохраняет состав заказа', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    categoryId = await ensureCategory(payload)

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Страна заявки ${uniq()}`, slug: `strana-zayavki-${uniq()}` },
    })

    const event = await payload.create({
      collection: 'events',
      data: {
        title: `Событие заявки ${uniq()}`,
        slug: `sobytie-zayavki-${uniq()}`,
        category: categoryId,
        country: country.id,
        price: 5000,
        currency: 'rub',
        status: 'published',
        addons: [
          { label: 'Трансфер', price: 1000, type: 'transfer' },
          { label: 'Страховка', price: 500, type: 'insurance' },
        ],
      },
    })
    eventId = event.id
  })

  it('сохраняет выбранные допки и итоговую сумму', async () => {
    const lead = await payload.create({
      collection: 'leads',
      data: {
        name: 'Иван',
        phone: '+7 900 000-00-00',
        event: eventId,
        orderItems: [
          { label: 'Билет', price: 5000 },
          { label: 'Трансфер', price: 1000 },
        ],
        orderTotal: 6000,
        orderCurrency: 'rub',
      },
    })

    expect(lead.orderItems).toHaveLength(2)
    expect(lead.orderItems?.[0]).toMatchObject({ label: 'Билет', price: 5000 })
    expect(lead.orderTotal).toBe(6000)
    expect(lead.orderCurrency).toBe('rub')
  })

  it('состав необязателен — заявка без допок создаётся', async () => {
    const lead = await payload.create({
      collection: 'leads',
      data: { name: 'Пётр', phone: '+7 900 111-11-11', event: eventId },
    })

    expect(lead.orderItems ?? []).toHaveLength(0)
  })

  it('состав хранится копией: правка цены события заявку не меняет', async () => {
    const lead = await payload.create({
      collection: 'leads',
      data: {
        name: 'Мария',
        phone: '+7 900 222-22-22',
        event: eventId,
        orderItems: [{ label: 'Билет', price: 5000 }],
        orderTotal: 5000,
        orderCurrency: 'rub',
      },
    })

    await payload.update({
      collection: 'events',
      id: eventId,
      data: { price: 9999 },
    })

    const after = await payload.findByID({ collection: 'leads', id: lead.id })
    expect(after.orderTotal).toBe(5000)
    expect(after.orderItems?.[0]).toMatchObject({ price: 5000 })
  })
})
