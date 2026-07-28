import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'

// Верхний уровень географии: регион → страна → город.
// Ось навигации «куда поехать» и SEO-хабов.
export const Regions: CollectionConfig = {
  slug: 'regions',
  labels: { singular: 'Регион', plural: 'Регионы' },
  admin: { useAsTitle: 'name', group: 'География', defaultColumns: ['name', 'slug'] },
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
    { name: 'description', type: 'richText', label: 'Описание' },
    seoField,
  ],
}
