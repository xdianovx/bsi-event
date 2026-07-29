import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { ensureCategory } from '../helpers/category'
import { setRate } from '../helpers/rates'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload
let categoryId: number
let countryId: number

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const makeEvent = (data: Record<string, unknown>) =>
  payload.create({
    collection: 'events',
    data: {
      title: `Событие ${uniq()}`,
      slug: `sobytie-${uniq()}`,
      category: categoryId,
      country: countryId,
      basePrice: 1000,
      currency: 'rub',
      status: 'published',
      ...data,
    } as never,
  })

describe('Оси цены события', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    categoryId = await ensureCategory(payload)

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Ценовая страна ${uniq()}`, slug: `cenovaya-strana-${uniq()}` },
    })
    countryId = country.id
  })

  it('без осей цена «от» равна базовой части', async () => {
    const event = await makeEvent({ basePrice: 5000 })

    expect(event.priceFrom).toBe(5000)
    expect(event.priceRub).toBe(5000)
  })

  it('складывает базу с самым дешёвым билетом и самым дешёвым номером', async () => {
    const event = await makeEvent({
      basePrice: 1000,
      ticketTypes: [
        { name: 'Трибуна', price: 500 },
        { name: 'Фан-зона', price: 200 },
      ],
      accommodations: [
        { hotelName: 'Люкс-отель', roomName: 'Делюкс', price: 900 },
        { hotelName: 'Хостел', roomName: 'Стандарт', price: 300 },
      ],
    })

    // 1000 + 200 + 300
    expect(event.priceFrom).toBe(1500)
  })

  it('пустая ось в сумму не входит: событие без проживания дешевле ровно на номер', async () => {
    const event = await makeEvent({
      basePrice: 1000,
      ticketTypes: [{ name: 'Единый', price: 400 }],
    })

    expect(event.priceFrom).toBe(1400)
  })

  it('распроданный вариант не участвует в минимуме', async () => {
    const event = await makeEvent({
      basePrice: 1000,
      ticketTypes: [
        { name: 'Дешёвый, но распродан', price: 100, soldOut: true },
        { name: 'Доступный', price: 450 },
      ],
    })

    // Показывать 1100 нельзя: за эти деньги билет уже не купить
    expect(event.priceFrom).toBe(1450)
  })

  it('ось, распроданная целиком, выпадает из суммы', async () => {
    const event = await makeEvent({
      basePrice: 1000,
      accommodations: [{ hotelName: 'Отель', roomName: 'Стандарт', price: 700, soldOut: true }],
    })

    expect(event.priceFrom).toBe(1000)
  })

  it('программа по дням и площадка сохраняются вместе с событием', async () => {
    const event = await makeEvent({
      venueName: 'Арена',
      address: 'Улица, 1',
      itinerary: [
        { day: 2, title: 'Матч' },
        { day: 1, title: 'Прилёт' },
      ],
    })

    expect(event.venueName).toBe('Арена')
    expect(event.itinerary).toHaveLength(2)
  })

  it('валютная цена «от» переводится в рубли по курсу', async () => {
    await setRate(payload, 'usd', 100)
    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 0 } })

    const event = await makeEvent({
      basePrice: 200,
      currency: 'usd',
      ticketTypes: [{ name: 'Вход', price: 100 }],
    })

    expect(event.priceFrom).toBe(300)
    expect(event.priceRub).toBe(30000)
  }, 60_000)

  it('базовая часть обязательна: без неё событие не создаётся', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: {
          title: `Событие без цены ${uniq()}`,
          category: categoryId,
          country: countryId,
          status: 'published',
        } as never,
      }),
    ).rejects.toThrow()
  })
})
