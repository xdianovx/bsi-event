import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'

// Статические страницы: о компании, оферта, политика ПДн.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Страница', plural: 'Страницы' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'slug'] },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заголовок' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
    },
    { name: 'content', type: 'richText', label: 'Содержимое' },
    seoField,
  ],
}
