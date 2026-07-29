import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { slugify } from '@/shared/lib'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('Категории событий', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('создаётся с автослагом из названия', async () => {
    const name = `Фестивали автотест ${Date.now()}`
    const doc = await payload.create({
      collection: 'categories',
      // slug опущен намеренно — подставляет хук beforeValidate
      data: { name } as never,
    })

    expect(doc.slug).toBe(slugify(name))
  })

  it('не перезаписывает явно заданный слаг', async () => {
    const doc = await payload.create({
      collection: 'categories',
      data: { name: `Театр автотест ${Date.now()}`, slug: `custom-category-${Date.now()}` },
    })

    expect(doc.slug).toMatch(/^custom-category-/)
  })

  it('не допускает двух категорий с одинаковым слагом', async () => {
    const slug = `duplicate-category-${Date.now()}`
    await payload.create({ collection: 'categories', data: { name: 'Первая', slug } })

    await expect(
      payload.create({ collection: 'categories', data: { name: 'Вторая', slug } }),
    ).rejects.toThrow()
  })

  it('транслитерация «Концерты» даёт kontserty — поэтому слаг в сиде задан явно', () => {
    // Проверка фиксирует причину: ц → ts, а в адресе нужен koncerty
    expect(slugify('Концерты')).toBe('kontserty')
  })

  it('читается публично и находится по слагу', async () => {
    const slug = `public-category-${Date.now()}`
    await payload.create({ collection: 'categories', data: { name: 'Публичная', slug } })

    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    expect(docs).toHaveLength(1)
    expect(docs[0].name).toBe('Публичная')
  })
})
