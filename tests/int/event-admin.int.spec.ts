import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { ensureCategory } from '../helpers/category'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload
let categoryId: number
let spainId: number
let italyId: number
let madridId: number

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const makeEvent = (data: Record<string, unknown>) =>
  payload.create({
    collection: 'events',
    data: {
      title: `Событие ${uniq()}`,
      category: categoryId,
      country: spainId,
      price: 1000,
      currency: 'rub',
      status: 'published',
      ...data,
    } as never,
  })

describe('Карточка события в админке', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    categoryId = await ensureCategory(payload)

    const spain = await payload.create({
      collection: 'countries',
      data: { name: `Испания ${uniq()}`, slug: `ispaniya-${uniq()}` },
    })
    spainId = spain.id

    const italy = await payload.create({
      collection: 'countries',
      data: { name: `Италия ${uniq()}`, slug: `italiya-${uniq()}` },
    })
    italyId = italy.id

    const madrid = await payload.create({
      collection: 'cities',
      data: { name: `Мадрид ${uniq()}`, slug: `madrid-${uniq()}`, country: spainId },
    })
    madridId = madrid.id
  })

  it('город из выбранной страны сохраняется', async () => {
    const event = await makeEvent({ country: spainId, city: madridId })

    // create отдаёт связи раскрытыми, поэтому сравниваем id, а не сам объект.
    const cityId = typeof event.city === 'object' ? event.city?.id : event.city
    expect(cityId).toBe(madridId)
  })

  it('город чужой страны не проходит: список ограничен фильтром, а он же проверяется при сохранении', async () => {
    await expect(makeEvent({ country: italyId, city: madridId })).rejects.toThrow()
  })

  it('ночи подставляются как дни минус один', async () => {
    const event = await makeEvent({ days: 8 })

    expect(event.nights).toBe(7)
  })

  it('введённые ночи не перебиваются: бывает 3 дня и 3 ночи с ночным перелётом', async () => {
    const event = await makeEvent({ days: 3, nights: 3 })

    expect(event.nights).toBe(3)
  })

  it('без дней ночи остаются пустыми', async () => {
    const event = await makeEvent({})

    expect(event.days ?? null).toBeNull()
    expect(event.nights ?? null).toBeNull()
  })

  describe('Раскладка формы', () => {
    const events = async () => {
      const { collections } = await config
      return collections.find((collection) => collection.slug === 'events')!
    }

    it('поля разложены по вкладкам, а не одной портянкой', async () => {
      const tabs = (await events()).fields.find((field) => field.type === 'tabs')

      expect(tabs).toBeDefined()
      expect(
        tabs && 'tabs' in tabs ? tabs.tabs.map((tab) => ('label' in tab ? tab.label : null)) : [],
      ).toEqual(['Основное', 'Цены', 'Состав', 'Медиа', 'SEO'])
    })

    it('в правой колонке то, к чему возвращаются постоянно', async () => {
      const nameOf = (field: unknown) =>
        (field as { name?: string; fields?: unknown[] }).name
          ? [(field as { name: string }).name]
          : ((field as { fields?: { name?: string }[] }).fields ?? []).map((inner) => inner.name)

      const sidebar = (await events()).fields
        .filter((field) => 'admin' in field && field.admin?.position === 'sidebar')
        .flatMap(nameOf)

      expect(sidebar).toEqual(
        expect.arrayContaining([
          'status',
          'slug',
          'viewOnSite',
          'startDate',
          'endDate',
          'days',
          'nights',
          'priceSummary',
        ]),
      )
    })

    it('поле priceRub из формы убрано: править его нельзя, в сайдбаре — сводка', async () => {
      const priceRub = (await events()).fields.find(
        (field) => 'name' in field && field.name === 'priceRub',
      ) as { admin?: { hidden?: boolean } } | undefined

      expect(priceRub?.admin?.hidden).toBe(true)
    })
  })
})
