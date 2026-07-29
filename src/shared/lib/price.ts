export type Currency = 'rub' | 'usd' | 'eur'

export type Rates = { usd: number; eur: number }

type CalcPriceRubArgs = {
  price: number
  currency: Currency
  rates: Rates
  markupPercent: number
}

/**
 * Приводит цену события к рублям для сортировки и фильтрации каталога.
 * Рублёвая цена берётся как есть — ни курса, ни наценки к ней не применяем.
 */
export const calcPriceRub = ({ price, currency, rates, markupPercent }: CalcPriceRubArgs): number => {
  if (currency === 'rub') return price

  // (100 + markup) / 100, а не (1 + markup / 100): второй вариант копит ошибку
  // плавающей точки и роняет округление на копейку вниз (10762.4999… вместо 10762.5).
  return Math.round((price * rates[currency] * (100 + markupPercent)) / 100)
}

/** Строка репитера, участвующая в цене: категория билета или вариант размещения. */
export type PriceAxisRow = { price?: number | null; soldOut?: boolean | null }

/**
 * Цена «от»: базовая часть плюс самый дешёвый доступный билет плюс самое дешёвое
 * доступное размещение.
 *
 * Пустая ось в сумму не входит — событие без проживания стоит ровно столько, сколько
 * стоит без проживания. Распроданные варианты тоже не входят: иначе на карточке висела
 * бы цена, которую нельзя купить.
 */
export const calcPriceFrom = (basePrice: number, ...axes: PriceAxisRow[][]): number =>
  axes.reduce((sum, rows) => {
    const prices = (rows ?? [])
      .filter((row) => !row?.soldOut && typeof row?.price === 'number')
      .map((row) => row.price as number)

    return prices.length ? sum + Math.min(...prices) : sum
  }, basePrice)
