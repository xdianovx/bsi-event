import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { syncExchangeRates } from '@/cms/jobs/syncExchangeRates'
import type { CbrResponse } from '@/cms/lib/cbr'
import { clearRates } from '../helpers/rates'

import { describe, it, beforeAll, beforeEach, expect } from 'vitest'

let payload: Payload

const DATE = new Date(Date.UTC(2026, 8, 15)).toISOString()

const answer = (usd: number, eur: number): (() => Promise<CbrResponse>) => async () => ({
  date: DATE,
  rates: [
    { currency: 'usd', rate: usd },
    { currency: 'eur', rate: eur },
  ],
})

/** Курсы за дату словарём: порядок выдачи не гарантирован и в ожиданиях не нужен. */
const ratesOn = async (date: string) => {
  const { docs } = await payload.find({
    collection: 'exchangeRates',
    where: { date: { equals: date } },
  })

  return Object.fromEntries(
    docs.map((doc) => [doc.currency, { rate: doc.rate, source: doc.source }]),
  )
}

const settings = () => payload.findGlobal({ slug: 'settings' })

describe('Синхронизация курса с ЦБ', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  beforeEach(async () => {
    await clearRates(payload, 'usd')
    await clearRates(payload, 'eur')
    await payload.updateGlobal({
      slug: 'settings',
      data: { ratesAutoUpdate: true, lastSyncStatus: '' },
    })
  })

  it('записывает курс обеих валют с пометкой источника', async () => {
    const result = await syncExchangeRates({ payload, fetchRates: answer(80, 90) })

    expect(result).toEqual({ status: 'ok', date: DATE, count: 2 })

    expect(await ratesOn(DATE)).toEqual({
      usd: { rate: 80, source: 'cbr' },
      eur: { rate: 90, source: 'cbr' },
    })
  })

  it('повторный запуск за тот же день обновляет запись, а не плодит дубль', async () => {
    await syncExchangeRates({ payload, fetchRates: answer(80, 90) })
    await syncExchangeRates({ payload, fetchRates: answer(85, 95) })

    const docs = await ratesOn(DATE)
    expect(Object.keys(docs)).toHaveLength(2)
    expect(docs.usd?.rate).toBe(85)
    expect(docs.eur?.rate).toBe(95)
  }, 60_000)

  it('отмечает успешную синхронизацию в настройках', async () => {
    await syncExchangeRates({ payload, fetchRates: answer(80, 90) })

    const after = await settings()
    expect(after.lastSyncStatus).toBe('Успешно')
    expect(after.lastSyncAt).toBeTruthy()
  })

  it('источник недоступен: курс остаётся прежним, в настройках видно ошибку', async () => {
    await syncExchangeRates({ payload, fetchRates: answer(80, 90) })

    const failing = async () => {
      throw new Error('ЦБ ответил 503')
    }

    await expect(syncExchangeRates({ payload, fetchRates: failing })).rejects.toThrow('503')

    // Цены считаются по последнему известному курсу — история не тронута.
    const docs = await ratesOn(DATE)
    expect(docs.usd?.rate).toBe(80)
    expect(docs.eur?.rate).toBe(90)

    const after = await settings()
    expect(after.lastSyncStatus).toBe('Ошибка: ЦБ ответил 503')
  }, 60_000)

  it('выключенное автообновление пропускает синхронизацию', async () => {
    await payload.updateGlobal({ slug: 'settings', data: { ratesAutoUpdate: false } })

    const result = await syncExchangeRates({ payload, fetchRates: answer(80, 90) })

    expect(result.status).toBe('skipped')
    expect(await ratesOn(DATE)).toEqual({})
  })

  it('задача зарегистрирована в конфиге и лежит в очереди rates', async () => {
    const { jobs } = await config
    const task = jobs?.tasks?.find((item) => item.slug === 'syncExchangeRates')

    expect(task).toBeDefined()
    expect(task?.schedule?.[0]?.queue).toBe('rates')
  })
})
