import { describe, it, expect } from 'vitest'
import { parseCbrXml } from '@/cms/lib/cbr'

/** Фрагмент живого ответа ЦБ: запятая в дробях, номинал, дата в атрибуте. */
const xml = `<?xml version="1.0" encoding="windows-1251"?>
<ValCurs Date="29.07.2026" name="Foreign Currency Market">
<Valute ID="R01235"><NumCode>840</NumCode><CharCode>USD</CharCode><Nominal>1</Nominal><Name>Доллар США</Name><Value>78,6980</Value><VunitRate>78,698</VunitRate></Valute>
<Valute ID="R01239"><NumCode>978</NumCode><CharCode>EUR</CharCode><Nominal>1</Nominal><Name>Евро</Name><Value>89,6292</Value><VunitRate>89,6292</VunitRate></Valute>
<Valute ID="R01375"><NumCode>156</NumCode><CharCode>CNY</CharCode><Nominal>10</Nominal><Name>Китайских юаней</Name><Value>109,5000</Value><VunitRate>10,95</VunitRate></Valute>
</ValCurs>`

describe('Разбор ответа ЦБ', () => {
  it('берёт доллар и евро, остальные валюты игнорирует', () => {
    const { rates } = parseCbrXml(xml)

    expect(rates).toEqual([
      { currency: 'usd', rate: 78.698 },
      { currency: 'eur', rate: 89.6292 },
    ])
  })

  it('дату курса берёт из атрибута и приводит к полуночи UTC', () => {
    expect(parseCbrXml(xml).date).toBe('2026-07-29T00:00:00.000Z')
  })

  it('делит цену на номинал', () => {
    // У доллара и евро номинал равен единице, поэтому формулу проверяем подставным
    // ответом: иначе ошибка «забыли поделить» прошла бы мимо теста.
    const withNominal = `<ValCurs Date="29.07.2026">
<Valute><CharCode>USD</CharCode><Nominal>1</Nominal><Value>78,0000</Value></Valute>
<Valute><CharCode>EUR</CharCode><Nominal>100</Nominal><Value>52,0000</Value></Valute>
</ValCurs>`

    const { rates } = parseCbrXml(withNominal)

    expect(rates.find((rate) => rate.currency === 'eur')?.rate).toBe(0.52)
  })

  it('падает, если в ответе нет нужных валют', () => {
    const empty = `<ValCurs Date="29.07.2026"><Valute><CharCode>CNY</CharCode><Nominal>10</Nominal><Value>109,5000</Value></Valute></ValCurs>`

    expect(() => parseCbrXml(empty)).toThrow(/нет курса/)
  })

  it('падает, если формат ответа поменялся и даты нет', () => {
    expect(() => parseCbrXml('<ValCurs name="Foreign Currency Market"></ValCurs>')).toThrow(
      /нет даты/,
    )
  })
})
