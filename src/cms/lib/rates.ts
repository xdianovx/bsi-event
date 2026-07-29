import type { PayloadRequest } from 'payload'
import type { Currency, Rates } from '@/shared/lib'

type Foreign = Exclude<Currency, 'rub'>

const FOREIGN: Foreign[] = ['usd', 'eur']

/**
 * Последний известный курс каждой валюты.
 *
 * Свежести не требуем намеренно: если синхронизация с ЦБ упала, сайт продолжает считать
 * по последней записи, а не отдаёт нули. Пустая коллекция — только на чистой базе до сида,
 * там курс и правда неизвестен.
 */
export const getLatestRates = async (req: PayloadRequest): Promise<Rates> => {
  const entries = await Promise.all(
    FOREIGN.map(async (currency) => {
      const { docs } = await req.payload.find({
        collection: 'exchangeRates',
        where: { currency: { equals: currency } },
        sort: '-date',
        limit: 1,
        depth: 0,
        req,
      })

      return [currency, docs[0]?.rate ?? 0] as const
    }),
  )

  return Object.fromEntries(entries) as Rates
}
