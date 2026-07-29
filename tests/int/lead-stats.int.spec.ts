import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { ensureCategory } from '../helpers/category'
import { describe, it, beforeAll, expect } from 'vitest'
import { collectLeadStats } from '@/entities/lead'

let payload: Payload
let categoryId: number
let eventId: number

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('Статистика заявок', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    categoryId = await ensureCategory(payload)

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Страна стат ${uniq()}`, slug: `strana-stat-${uniq()}` },
    })
    const event = await payload.create({
      collection: 'events',
      data: {
        title: `Событие стат ${uniq()}`,
        slug: `sobytie-stat-${uniq()}`,
        category: categoryId,
        country: country.id,
        basePrice: 1000,
        currency: 'rub',
        status: 'published',
      } as never,
    })
    eventId = event.id

    // Свежая обработанная, свежая необработанная и старая
    await payload.create({
      collection: 'leads',
      data: { name: 'Свежий 1', phone: '1', event: eventId, processed: false },
    })
    await payload.create({
      collection: 'leads',
      data: { name: 'Свежий 2', phone: '2', event: eventId, processed: true },
    })
    const old = await payload.create({
      collection: 'leads',
      data: { name: 'Старый', phone: '3', event: eventId, processed: false },
    })
    // createdAt задаётся Payload, поэтому дату сдвигаем отдельным апдейтом
    await payload.update({
      collection: 'leads',
      id: old.id,
      data: { createdAt: daysAgo(40) } as never,
    })
  })

  it('считает заявки за период и необработанные', async () => {
    const stats = await collectLeadStats(payload)

    expect(stats.total).toBeGreaterThanOrEqual(3)
    expect(stats.unprocessed).toBeGreaterThanOrEqual(2)
    expect(stats.week).toBeGreaterThanOrEqual(2)
  })

  it('заявка старше месяца не попадает в недельный и месячный срез', async () => {
    const stats = await collectLeadStats(payload)

    expect(stats.month).toBeLessThan(stats.total)
  })

  it('показывает топ событий по числу заявок', async () => {
    const stats = await collectLeadStats(payload)

    const row = stats.topEvents.find((e) => e.id === eventId)
    expect(row?.count).toBeGreaterThanOrEqual(3)
    expect(row?.title).toContain('Событие стат')
  })
})
