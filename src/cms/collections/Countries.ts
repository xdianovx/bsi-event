import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'

// Ось фасетных URL: /sobytiya/{тип}/{slug страны}/
export const Countries: CollectionConfig = {
  slug: 'countries',
  labels: { singular: 'Страна', plural: 'Страны' },
  admin: { useAsTitle: 'name', group: 'География', defaultColumns: ['name', 'code', 'region'] },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Название' },
    {
      name: 'code',
      type: 'text',
      unique: true,
      index: true,
      label: 'Код ISO',
      admin: {
        position: 'sidebar',
        description: 'Две буквы по ISO 3166-1 (it, fr). По нему подставляется флаг.',
      },
      // Приводим к нижнему регистру: код участвует в пути к файлу флага,
      // а «IT» и «it» дали бы разные адреса.
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.toLowerCase() : value)] },
    },
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
          'Необязательно: по умолчанию флаг берётся по коду ISO. Это поле — переопределение. Отдаётся через <img>, инлайном в разметку не встраивается: сторонний SVG может содержать скрипт.',
      },
    },
    {
      // Города видны и заводятся прямо со страницы страны — иначе править
      // географию пришлось бы, прыгая между двумя плоскими списками.
      name: 'cities',
      type: 'join',
      collection: 'cities',
      on: 'country',
      label: 'Города',
      // Колонку «Страна» не показываем: внутри страны она одна и та же,
      // а связь тут не подгружается и выводится как пустая.
      admin: { defaultColumns: ['name', 'slug'] },
    },
    seoField,
  ],
}
