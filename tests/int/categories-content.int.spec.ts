import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { collectPopulatedCategories } from '@/entities/category'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload
let countryId: number

const uniq = () => `${Date.now()}${Math.round(performance.now())}`

const makeCategory = async (name: string) =>
  payload.create({ collection: 'categories', data: { name, slug: `cat-${uniq()}` } })

const makeEvent = async (categoryId: number, status: 'published' | 'draft' = 'published') =>
  payload.create({
    collection: 'events',
    data: {
      title: `Событие ${uniq()}`,
      slug: `sobytie-${uniq()}`,
      category: categoryId,
      country: countryId,
      price: 10000,
      currency: 'rub',
      status,
    },
  })

describe('Наполненность категорий и защита от удаления', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const country = await payload.create({
      collection: 'countries',
      data: { name: `Страна ${uniq()}`, slug: `strana-${uniq()}` },
    })
    countryId = country.id
  })

  it('категория с опубликованным событием считается наполненной', async () => {
    const category = await makeCategory('С событием')
    await makeEvent(category.id)

    const populated = await collectPopulatedCategories(payload)

    expect(populated.ids.has(category.id)).toBe(true)
    expect(populated.counts.get(category.id)).toBe(1)
  })

  it('категория только с черновиком считается пустой', async () => {
    const category = await makeCategory('Только черновик')
    await makeEvent(category.id, 'draft')

    const populated = await collectPopulatedCategories(payload)

    expect(populated.ids.has(category.id)).toBe(false)
  })

  it('категория без событий считается пустой', async () => {
    const category = await makeCategory('Пустая')

    const populated = await collectPopulatedCategories(payload)

    expect(populated.ids.has(category.id)).toBe(false)
  })

  it('свободная категория удаляется', async () => {
    const category = await makeCategory('Свободная')

    await payload.delete({ collection: 'categories', id: category.id })

    const { docs } = await payload.find({
      collection: 'categories',
      where: { id: { equals: category.id } },
      limit: 1,
    })
    expect(docs).toHaveLength(0)
  })

  it('используемая категория не удаляется, данные целы', async () => {
    const category = await makeCategory('Занятая')
    const event = await makeEvent(category.id)

    await expect(
      payload.delete({ collection: 'categories', id: category.id }),
    ).rejects.toThrow(/используется в 1 событиях/)

    const { docs: stillThere } = await payload.find({
      collection: 'categories',
      where: { id: { equals: category.id } },
      limit: 1,
    })
    expect(stillThere).toHaveLength(1)

    const saved = await payload.findByID({ collection: 'events', id: event.id, depth: 0 })
    expect(saved.category).toBe(category.id)
  })

  it('событие нельзя создать без категории — поле обязательное', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: {
          title: `Без категории ${uniq()}`,
          slug: `bez-kategorii-${uniq()}`,
          country: countryId,
          price: 1000,
          currency: 'rub',
        } as never,
      }),
    ).rejects.toThrow()
  })

  it('каталог по слагу категории отдаёт только её события', async () => {
    const target = await makeCategory('Целевая')
    const other = await makeCategory('Прочая')
    const mine = await makeEvent(target.id)
    await makeEvent(other.id)

    const { docs } = await payload.find({
      collection: 'events',
      where: { status: { equals: 'published' }, 'category.slug': { equals: target.slug } },
      limit: 0,
      depth: 0,
    })

    expect(docs.map((doc) => doc.id)).toEqual([mine.id])
  })
})
