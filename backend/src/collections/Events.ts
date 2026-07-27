import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Событие', plural: 'События' },
  admin: { useAsTitle: 'name', group: 'Каталог', defaultColumns: ['name', 'type', 'date'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Название' },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Тип',
      options: [
        { label: 'Концерт', value: 'concert' },
        { label: 'Спорт', value: 'sport' },
        { label: 'Гонки', value: 'racing' },
      ],
    },
    { name: 'date', type: 'date', label: 'Дата события' },
  ],
}
