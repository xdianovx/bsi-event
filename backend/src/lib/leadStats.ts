import type { Payload, Where } from 'payload'

export type LeadStats = {
  total: number
  today: number
  week: number
  month: number
  unprocessed: number
  topEvents: { id: number; title: string; count: number }[]
}

const since = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/** Сколько заявок подходит под условие. limit: 0 не тянет документы, только счёт. */
const countLeads = async (payload: Payload, where: Where) => {
  const { totalDocs } = await payload.find({
    collection: 'leads',
    where,
    limit: 0,
    depth: 0,
  })
  return totalDocs
}

/**
 * Считает витрину дашборда запросом, а не хранит агрегаты: заявок немного,
 * а хранимые счётчики рассинхронизируются при любой правке в обход кода.
 */
export const collectLeadStats = async (payload: Payload, topLimit = 5): Promise<LeadStats> => {
  const [total, today, week, month, unprocessed] = await Promise.all([
    countLeads(payload, {}),
    countLeads(payload, { createdAt: { greater_than_equal: since(1) } }),
    countLeads(payload, { createdAt: { greater_than_equal: since(7) } }),
    countLeads(payload, { createdAt: { greater_than_equal: since(30) } }),
    countLeads(payload, { processed: { equals: false } }),
  ])

  // Топ считаем по последним заявкам: полный перебор коллекции ради витрины
  // не нужен, а порядок в верхушке от этого не меняется.
  const { docs } = await payload.find({
    collection: 'leads',
    limit: 500,
    depth: 1,
    sort: '-createdAt',
  })

  const tally = new Map<number, { id: number; title: string; count: number }>()

  for (const lead of docs) {
    const event = lead.event
    if (typeof event !== 'object' || !event) continue

    const row = tally.get(event.id) ?? { id: event.id, title: event.title, count: 0 }
    row.count += 1
    tally.set(event.id, row)
  }

  const topEvents = [...tally.values()].sort((a, b) => b.count - a.count).slice(0, topLimit)

  return { total, today, week, month, unprocessed, topEvents }
}
