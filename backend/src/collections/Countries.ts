import type { CollectionConfig } from 'payload'
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
  ],
}
