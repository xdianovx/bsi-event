import type { FieldHook } from 'payload'
import { calcPriceRub, type Currency } from '../lib/price'

/**
 * Считает рублёвый эквивалент цены события.
 *
 * Поле хранится в БД, а не virtual: по нему идут сортировка и фильтрация каталога,
 * а виртуальные поля Postgres не видит.
 */
export const computePriceRub: FieldHook = async ({ siblingData, req }) => {
  const price = siblingData?.price
  const currency = (siblingData?.currency ?? 'rub') as Currency

  if (typeof price !== 'number') return undefined

  if (currency === 'rub') return price

  const settings = await req.payload.findGlobal({ slug: 'settings', req })

  return calcPriceRub({
    price,
    currency,
    rates: { usd: settings.rates.usd, eur: settings.rates.eur },
    markupPercent: settings.markupPercent ?? 0,
  })
}
