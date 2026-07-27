import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'

export const Tours: CollectionConfig = {
  slug: 'tours',
  labels: { singular: 'Тур', plural: 'Туры' },
  admin: {
    useAsTitle: 'title',
    group: 'Каталог',
    defaultColumns: ['title', 'event', 'country', 'startDate', 'status'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Название тура' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      label: 'Событие',
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      label: 'Страна',
    },
    { name: 'city', type: 'text', label: 'Город' },
    {
      type: 'row',
      fields: [
        { name: 'startDate', type: 'date', label: 'Начало', admin: { width: '33%' } },
        { name: 'endDate', type: 'date', label: 'Окончание', admin: { width: '33%' } },
        { name: 'duration', type: 'number', label: 'Дней', admin: { width: '33%' } },
      ],
    },
    {
      name: 'includes',
      type: 'group',
      label: 'Что входит',
      fields: [
        { name: 'ticket', type: 'checkbox', label: 'Билет на событие', defaultValue: true },
        { name: 'visa', type: 'checkbox', label: 'Виза', defaultValue: false },
        { name: 'accommodation', type: 'checkbox', label: 'Расселение', defaultValue: false },
        {
          name: 'extra',
          type: 'array',
          label: 'Прочее',
          fields: [{ name: 'item', type: 'text', label: 'Пункт' }],
        },
      ],
    },
    {
      name: 'price',
      type: 'group',
      label: 'Цена',
      fields: [
        {
          name: 'onRequest',
          type: 'checkbox',
          label: 'По запросу',
          defaultValue: false,
        },
        {
          name: 'from',
          type: 'number',
          label: 'От, ₽',
          admin: {
            description: 'Отображается как «от X ₽»',
            condition: (_, siblingData) => !siblingData?.onRequest,
          },
        },
      ],
    },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Фото',
    },
    seoField,
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: 'Статус',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'Опубликован', value: 'published' },
        { label: 'В архиве', value: 'archived' },
      ],
    },
  ],
}
