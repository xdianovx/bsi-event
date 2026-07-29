import type { CollectionConfig } from 'payload'
import { generateSlug } from '../hooks/generateSlug'

/**
 * Из чего складывается тур: билеты, гид, отель, трансфер. Один справочник на
 * состав тура и на удобства номера — отсюда множественный `scope`: «Отель» и
 * «Питание» осмысленны в обеих ролях, а дубли ради одной роли пришлось бы
 * править дважды.
 */
export const Attributes: CollectionConfig = {
  slug: 'attributes',
  labels: { singular: 'Атрибут', plural: 'Атрибуты' },
  admin: {
    useAsTitle: 'name',
    group: 'Справочники',
    defaultColumns: ['name', 'scope', 'order', 'slug'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  // Вторичная сортировка по имени: при одинаковом order записи иначе меняются
  // местами между запросами, и список в админке начинает дрожать.
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
      admin: { description: 'Латиницей, автогенерируется из названия, можно переопределить' },
      hooks: { beforeValidate: [generateSlug('name')] },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'icons',
      label: 'Иконка',
      // Формат ограничен самой коллекцией icons; фильтр здесь — вторая линия
      // на случай, если в неё что-то попадёт мимо загрузки (импорт, правка в БД).
      filterOptions: { mimeType: { contains: 'svg' } },
      admin: {
        description:
          'Одноцветная SVG-иконка: цвет задаёт сайт. Выводится через CSS mask-image, поэтому цветная станет одноцветной.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
      admin: { description: 'Одна-две фразы: что именно входит. Показывается под названием.' },
    },
    {
      name: 'scope',
      type: 'select',
      hasMany: true,
      required: true,
      label: 'Где применяется',
      defaultValue: ['tour'],
      options: [
        { label: 'Тур', value: 'tour' },
        { label: 'Номер', value: 'room' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Порядок',
      admin: { position: 'sidebar' },
    },
  ],
}
