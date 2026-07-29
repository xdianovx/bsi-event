import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'
import { computePriceRub } from '../hooks/computePriceRub'

// Событие — продукт целиком: концерт/забег/etc с одной ценой в выбранной валюте
// и опциональными допками. Отдельной сущности «тур» нет, поездка и событие — одно.
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Событие', plural: 'События' },
  admin: {
    useAsTitle: 'title',
    group: 'Каталог',
    defaultColumns: ['title', 'category', 'country', 'startDate', 'status'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Название' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: { description: 'Латиницей, автогенерируется из названия, можно переопределить' },
      hooks: { beforeValidate: [generateSlug('title')] },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      index: true,
      label: 'Категория',
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      label: 'Страна',
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      index: true,
      label: 'Город',
    },
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
    { name: 'description', type: 'richText', label: 'Описание' },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          label: 'Цена',
          admin: { width: '50%' },
        },
        {
          name: 'currency',
          type: 'select',
          required: true,
          defaultValue: 'rub',
          label: 'Валюта',
          admin: { width: '50%' },
          options: [
            { label: '₽ Рубль', value: 'rub' },
            { label: '$ Доллар', value: 'usd' },
            { label: '€ Евро', value: 'eur' },
          ],
        },
      ],
    },
    {
      name: 'priceRub',
      type: 'number',
      index: true,
      label: 'Цена в рублях',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Считается по курсу и наценке из настроек. Каталог сортирует по этому полю.',
      },
      hooks: { beforeChange: [computePriceRub] },
    },
    {
      name: 'addons',
      type: 'array',
      label: 'Допки (дополнительные опции)',
      admin: { description: 'Опциональные дополнения к билету. Цена — в валюте события.' },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Название' },
        { name: 'price', type: 'number', required: true, label: 'Цена' },
        { name: 'type', type: 'text', label: 'Тип (свободный текст)' },
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
