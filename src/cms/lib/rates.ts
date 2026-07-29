import type { Payload, PayloadRequest } from 'payload'
import { calcPriceRub, type Currency, type Rates } from '@/shared/lib'

type Foreign = Exclude<Currency, 'rub'>

const FOREIGN: Foreign[] = ['usd', 'eur']

type Args = { payload: Payload; req?: PayloadRequest }

/**
 * Последний известный курс каждой валюты.
 *
 * Свежести не требуем намеренно: если синхронизация с ЦБ упала, сайт продолжает считать
 * по последней записи, а не отдаёт нули. Пустая коллекция — только на чистой базе до сида,
 * там курс и правда неизвестен.
 */
export const getLatestRates = async ({ payload, req }: Args): Promise<Rates> => {
  const entries = await Promise.all(
    FOREIGN.map(async (currency) => {
      const { docs } = await payload.find({
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

/**
 * Переводит цены события в рубли — ту же цифру, что лежит в `priceRub` каталога.
 *
 * Курс и наценку читаем один раз на страницу и отдаём готовую функцию: считать формулу
 * на клиенте нельзя, иначе округление разъедется с каталогом, а наценка компании уедет
 * в исходники страницы.
 */
export const getRubConverter = async ({ payload, req }: Args) => {
  const [rates, settings] = await Promise.all([
    getLatestRates({ payload, req }),
    payload.findGlobal({ slug: 'settings', req }),
  ])

  return (price: number, currency: Currency) =>
    calcPriceRub({ price, currency, rates, markupPercent: settings.markupPercent ?? 0 })
}
