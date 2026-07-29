import type { CollectionBeforeChangeHook } from 'payload'
import { calcPriceFrom, calcPriceRub, type Currency, type PriceAxisRow } from '@/shared/lib'
import { getLatestRates } from '../lib/rates'

/**
 * Считает цену события: `priceFrom` в валюте и `priceRub` для каталога.
 *
 * Хук уровня коллекции, а не поля: цена складывается из базовой части и двух репитеров,
 * а `siblingData` поля видит только своих соседей.
 *
 * Оба поля хранятся в БД. По `priceRub` идут сортировка и фильтрация каталога,
 * а виртуальные поля Postgres не видит.
 */
export const computeEventPrice: CollectionBeforeChangeHook = async ({ data, req }) => {
  const currency = (data.currency ?? 'rub') as Currency

  const priceFrom = calcPriceFrom(
    typeof data.basePrice === 'number' ? data.basePrice : 0,
    (data.ticketTypes ?? []) as PriceAxisRow[],
    (data.accommodations ?? []) as PriceAxisRow[],
  )

  const settings = await req.payload.findGlobal({ slug: 'settings', req })

  return {
    ...data,
    priceFrom,
    priceRub: calcPriceRub({
      price: priceFrom,
      currency,
      rates: await getLatestRates(req),
      markupPercent: settings.markupPercent ?? 0,
    }),
  }
}
