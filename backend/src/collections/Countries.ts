import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'

// Ось фасетных URL: /tury/{тип}/{slug страны}/
export const Countries: CollectionConfig = {
  slug: 'countries',
  labels: { singular: 'Страна', plural: 'Страны' },
  admin: { useAsTitle: 'name', group: 'Каталог', defaultColumns: ['name', 'slug'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Название' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: { description: 'Латиницей, автогенерируется из названия, можно переопределить' },
      hooks: { beforeValidate: [generateSlug('name')] },
    },
    {
      name: 'region',
      type: 'relationship',
      relationTo: 'regions',
      index: true,
      label: 'Регион',
    },
    {
      name: 'flag',
      type: 'upload',
      relationTo: 'media',
      label: 'Флаг (SVG)',
      // Только SVG: выбор ограничен на уровне поля, чтобы не заводить
      // отдельную коллекцию под флаги.
      filterOptions: { mimeType: { contains: 'svg' } },
      admin: {
        description:
          'Отдаётся через <img>, инлайном в разметку не встраивается: сторонний SVG может содержать скрипт.',
      },
    },
    seoField,
  ],
}
