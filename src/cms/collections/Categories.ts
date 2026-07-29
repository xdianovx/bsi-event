import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'

/**
 * Вид события: концерты, спорт, гонки. Раньше был select прямо в событии —
 * новый вид требовал выката. Теперь справочник, у которого есть свой адрес
 * `/kategorii/{slug}`, текст и SEO-блок.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категория', plural: 'Категории' },
  admin: { useAsTitle: 'name', group: 'Каталог', defaultColumns: ['name', 'slug', 'order'] },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  defaultSort: ['order', 'name'],
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Название' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        description:
          'Латиницей, автогенерируется из названия. Участвует в адресе /kategorii/{slug} — после индексации менять нельзя без редиректа.',
      },
      hooks: { beforeValidate: [generateSlug('name')] },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'icons',
      label: 'Иконка',
      // Формат ограничен коллекцией icons; фильтр — вторая линия на случай,
      // если туда что-то попадёт мимо загрузки.
      filterOptions: { mimeType: { contains: 'svg' } },
      admin: {
        description:
          'Одноцветная SVG-иконка: цвет задаёт сайт. Выводится через CSS mask-image, поэтому цветная станет одноцветной.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Описание',
      admin: { description: 'Текст лендинга категории. Показывается на /kategorii/{slug}.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Порядок',
      admin: { position: 'sidebar' },
    },
    seoField,
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const { totalDocs } = await req.payload.count({
          collection: 'events',
          where: { category: { equals: id } },
        })

        // Без этой проверки Payload молча вычистит связь, а поле обязательное:
        // событие останется без категории и не сохранится при следующей правке.
        if (totalDocs > 0) {
          throw new APIError(
            `Категория используется в ${totalDocs} событиях. Сначала переназначьте их на другую категорию.`,
            400,
          )
        }
      },
    ],
  },
}
