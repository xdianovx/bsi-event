import { describe, it, expect } from 'vitest'
import { calcPriceRub } from '@/shared/lib'

const rates = { usd: 95, eur: 105 }

describe('calcPriceRub', () => {
  it('рублёвую цену не трогает: ни курса, ни наценки', () => {
    expect(calcPriceRub({ price: 5000, currency: 'rub', rates, markupPercent: 3 })).toBe(5000)
  })

  it('валютную цену конвертирует по курсу и накидывает наценку', () => {
    // 1200 × 95 = 114 000, +3% = 117 420
    expect(calcPriceRub({ price: 1200, currency: 'usd', rates, markupPercent: 3 })).toBe(117420)
  })

  it('округляет до целых рублей', () => {
    // 100 × 105 = 10 500, +2.5% = 10 762.5 → 10 763
    expect(calcPriceRub({ price: 100, currency: 'eur', rates, markupPercent: 2.5 })).toBe(10763)
  })

  it('без наценки конвертирует по чистому курсу', () => {
    expect(calcPriceRub({ price: 10, currency: 'usd', rates, markupPercent: 0 })).toBe(950)
  })
})
