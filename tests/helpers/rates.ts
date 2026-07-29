import type { Payload } from 'payload'

export type Foreign = 'usd' | 'eur'

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`).toISOString()

/** Убирает всю историю валюты: цена считается по последней записи, и записи от
 *  прошлых прогонов иначе перебивали бы курс, который выставляет тест. */
export const clearRates = async (payload: Payload, currency: Foreign) => {
  await payload.delete({ collection: 'exchangeRates', where: { currency: { equals: currency } } })
}

export const addRate = async (
  payload: Payload,
  currency: Foreign,
  rate: number,
  date = '2026-01-01',
) =>
  payload.create({
    collection: 'exchangeRates',
    data: { date: day(date), currency, rate, source: 'manual' },
  })

/** Единственный курс валюты — предсказуемый старт для тестов цены. */
export const setRate = async (
  payload: Payload,
  currency: Foreign,
  rate: number,
  date = '2026-01-01',
) => {
  await clearRates(payload, currency)
  return addRate(payload, currency, rate, date)
}
