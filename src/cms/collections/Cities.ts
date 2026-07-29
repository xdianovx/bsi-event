import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'

// Нижний уровень географии. До Фазы 5 город был текстовым полем события —
// стал сущностью, чтобы иметь свою страницу и участвовать в фильтрах.
export const Cities: CollectionConfig = {
  slug: 'cities',
  labels: { singular: 'Город', plural: 'Города' },
  admin: { useAsTitle: 'name', group: 'География', defaultColumns: ['name', 'country', 'slug'] },
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
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      index: true,
      label: 'Страна',
    },
    seoField,
  ],
}
