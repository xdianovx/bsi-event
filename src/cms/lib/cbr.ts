export type Foreign = 'usd' | 'eur'

export type CbrRate = { currency: Foreign; rate: number }
export type CbrResponse = { date: string; rates: CbrRate[] }

const CBR_URL = 'https://www.cbr.ru/scripts/XML_daily.asp'

const WANTED: Record<string, Foreign> = { USD: 'usd', EUR: 'eur' }

// В ответе ЦБ дробная часть отделена запятой: <Value>78,6980</Value>.
const parseNumber = (raw: string) => Number(raw.replace(',', '.'))

/** `29.07.2026` из атрибута ValCurs@Date → полночь UTC. */
const parseDate = (raw: string) => {
  const [day, month, year] = raw.split('.').map(Number)
  if (!day || !month || !year) throw new Error(`ЦБ: непонятная дата курса «${raw}»`)

  return new Date(Date.UTC(year, month - 1, day)).toISOString()
}

/**
 * Разбирает ответ ЦБ.
 *
 * Регулярками, а не XML-парсером: схема ответа фиксирована десятилетиями, валют нам нужно
 * две, и ради этого тянуть зависимость незачем. Если формат всё-таки поменяется, разбор
 * упадёт с внятной ошибкой, а не подсунет тихо неверный курс.
 */
export const parseCbrXml = (xml: string): CbrResponse => {
  const rawDate = xml.match(/<ValCurs[^>]*\sDate="([\d.]+)"/)?.[1]
  if (!rawDate) throw new Error('ЦБ: в ответе нет даты курса')

  const rates: CbrRate[] = []

  for (const [, block] of xml.matchAll(/<Valute[^>]*>([\s\S]*?)<\/Valute>/g)) {
    const code = block.match(/<CharCode>(\w+)<\/CharCode>/)?.[1]
    const currency = code ? WANTED[code] : undefined
    if (!currency) continue

    // Номинал игнорировать нельзя: у доллара и евро он равен единице, но у иены — сто,
    // и при расширении списка валют ошибка всплыла бы молча.
    const nominal = parseNumber(block.match(/<Nominal>([\d,.]+)<\/Nominal>/)?.[1] ?? '')
    const value = parseNumber(block.match(/<Value>([\d,.]+)<\/Value>/)?.[1] ?? '')

    if (!nominal || !Number.isFinite(value)) throw new Error(`ЦБ: не разобран курс ${code}`)

    rates.push({ currency, rate: value / nominal })
  }

  if (rates.length !== 2) throw new Error('ЦБ: в ответе нет курса доллара или евро')

  return { date: parseDate(rawDate), rates }
}

export const fetchCbrRates = async (): Promise<CbrResponse> => {
  const res = await fetch(CBR_URL)
  if (!res.ok) throw new Error(`ЦБ ответил ${res.status}`)

  // Явное декодирование обязательно: ответ в windows-1251, а fetch читает тело как utf-8
  // и портит его.
  const xml = new TextDecoder('windows-1251').decode(await res.arrayBuffer())

  return parseCbrXml(xml)
}
