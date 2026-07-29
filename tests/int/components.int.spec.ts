import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'
import { slugify } from '@/shared/lib'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

/**
 * Тесты идут в jsdom, а его Buffer детектор типов из Payload не переваривает
 * и падает с «Could not read uploaded file for type detection» ещё до проверки
 * формата. Uint8Array читается нормально — в рантайме Next этой разницы нет.
 */
const bytes = (buffer: Buffer) => new Uint8Array(buffer) as unknown as Buffer

/** Минимальный валидный SVG — содержимое не важно, важен формат. */
const SVG = bytes(
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>',
  ),
)

/** 1×1 PNG: заголовок настоящий, иначе отказ пришёл бы от разбора файла, а не от mimeTypes. */
const PNG = bytes(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
)

describe('Справочник составляющих тура', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('создаётся с автослагом из названия', async () => {
    const name = `Гид автотест ${Date.now()}`
    const doc = await payload.create({
      collection: 'components',
      // slug опущен намеренно — подставляет хук beforeValidate, типы этого не знают
      data: { name, scope: ['tour'] } as never,
    })

    expect(doc.slug).toBe(slugify(name))
    expect(doc.scope).toEqual(['tour'])
  })

  it('не перезаписывает явно заданный слаг', async () => {
    const doc = await payload.create({
      collection: 'components',
      data: {
        name: `Трансфер автотест ${Date.now()}`,
        slug: `custom-component-${Date.now()}`,
        scope: ['tour'],
      },
    })

    expect(doc.slug).toMatch(/^custom-component-/)
  })

  it('не допускает двух записей с одинаковым слагом', async () => {
    const slug = `duplicate-component-${Date.now()}`
    await payload.create({
      collection: 'components',
      data: { name: 'Первая', slug, scope: ['tour'] },
    })

    await expect(
      payload.create({ collection: 'components', data: { name: 'Вторая', slug, scope: ['tour'] } }),
    ).rejects.toThrow()
  })

  it('хранит сразу две области применения', async () => {
    const doc = await payload.create({
      collection: 'components',
      data: {
        name: `Питание автотест ${Date.now()}`,
        slug: `pitanie-${Date.now()}`,
        scope: ['tour', 'room'],
      },
    })

    expect(doc.scope).toEqual(['tour', 'room'])

    const { docs } = await payload.find({
      collection: 'components',
      where: { scope: { contains: 'room' }, id: { equals: doc.id } },
      limit: 1,
    })
    expect(docs).toHaveLength(1)
  })

  it('требует хотя бы одну область применения', async () => {
    await expect(
      payload.create({
        collection: 'components',
        data: { name: 'Без области', slug: `bez-oblasti-${Date.now()}`, scope: [] } as never,
      }),
    ).rejects.toThrow()
  })

  it('принимает SVG в коллекцию иконок', async () => {
    const doc = await payload.create({
      collection: 'icons',
      data: { alt: `Иконка автотест ${Date.now()}` },
      file: { name: 'icon.svg', data: SVG, mimetype: 'image/svg+xml', size: SVG.length },
    })

    expect(doc.mimeType).toBe('image/svg+xml')
  })

  it('отклоняет не-SVG на сервере, а не только в файловом диалоге', async () => {
    await expect(
      payload.create({
        collection: 'icons',
        data: { alt: `PNG автотест ${Date.now()}` },
        file: { name: 'icon.png', data: PNG, mimetype: 'image/png', size: PNG.length },
      }),
    ).rejects.toThrow()
  })

  it('связывает составляющую с иконкой', async () => {
    const icon = await payload.create({
      collection: 'icons',
      data: { alt: `Иконка связи ${Date.now()}` },
      file: { name: 'linked.svg', data: SVG, mimetype: 'image/svg+xml', size: SVG.length },
    })

    const doc = await payload.create({
      collection: 'components',
      data: {
        name: `Виза автотест ${Date.now()}`,
        slug: `viza-${Date.now()}`,
        scope: ['tour'],
        icon: icon.id,
      },
      depth: 1,
    })

    expect(typeof doc.icon === 'object' && doc.icon?.mimeType).toBe('image/svg+xml')
  })
})
