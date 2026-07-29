import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'
import { computePriceRub } from '../hooks/computePriceRub'
import { fillNights } from '../hooks/fillNights'

// Событие — продукт целиком: концерт/забег/etc с одной ценой в выбранной валюте
// и опциональными допками. Отдельной сущности «тур» нет, поездка и событие — одно.
//
// Поля разложены по вкладкам: карточка события длинная, и одной портянкой в ней
// не найти нужное. В правой колонке — то, к чему возвращаются постоянно: статус,
// адрес страницы, даты и итоговая цена.
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
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          description: 'Что это за событие и где оно проходит',
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Название' },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
              index: true,
              label: 'Категория',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'country',
                  type: 'relationship',
                  relationTo: 'countries',
                  required: true,
                  label: 'Страна',
                  admin: { width: '50%' },
                },
                {
                  name: 'city',
                  type: 'relationship',
                  relationTo: 'cities',
                  index: true,
                  label: 'Город',
                  admin: {
                    width: '50%',
                    description: 'Список ограничен городами выбранной страны',
                  },
                  // Городов в справочнике 243, и без фильтра менеджер выберет Милан
                  // для Испании. Payload применяет filterOptions и при сохранении,
                  // поэтому несовпадающий город не пройдёт валидацию.
                  filterOptions: ({ data }) =>
                    data?.country ? { country: { equals: data.country } } : true,
                },
              ],
            },
            { name: 'description', type: 'richText', label: 'Описание' },
          ],
        },
        {
          label: 'Цены',
          description: 'Цена вводится в валюте события, покупатель видит рубли',
          fields: [
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
              name: 'addons',
              type: 'array',
              label: 'Допки (дополнительные опции)',
              admin: {
                description: 'Опциональные дополнения к билету. Цена — в валюте события.',
              },
              fields: [
                { name: 'label', type: 'text', required: true, label: 'Название' },
                { name: 'price', type: 'number', required: true, label: 'Цена' },
                { name: 'type', type: 'text', label: 'Тип (свободный текст)' },
              ],
            },
          ],
        },
        {
          label: 'Состав',
          description: 'Что входит в поездку',
          fields: [
            {
              name: 'includes',
              type: 'group',
              label: 'Что входит',
              fields: [
                { name: 'ticket', type: 'checkbox', label: 'Билет на событие', defaultValue: true },
                { name: 'visa', type: 'checkbox', label: 'Виза', defaultValue: false },
                {
                  name: 'accommodation',
                  type: 'checkbox',
                  label: 'Расселение',
                  defaultValue: false,
                },
                {
                  name: 'extra',
                  type: 'array',
                  label: 'Прочее',
                  fields: [{ name: 'item', type: 'text', label: 'Пункт' }],
                },
              ],
            },
          ],
        },
        {
          label: 'Медиа',
          fields: [
            {
              name: 'photos',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Фото',
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoField],
        },
      ],
    },

    // --- Правая колонка: то, к чему возвращаются на каждом сохранении ---

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
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Адрес страницы',
      admin: {
        position: 'sidebar',
        description: 'Латиницей, автогенерируется из названия, можно переопределить',
      },
      hooks: { beforeValidate: [generateSlug('title')] },
    },
    {
      name: 'viewOnSite',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/cms/ui/ViewOnSite#ViewOnSite' },
      },
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'startDate', type: 'date', label: 'Начало', admin: { width: '50%' } },
        { name: 'endDate', type: 'date', label: 'Окончание', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        {
          name: 'days',
          type: 'number',
          min: 1,
          label: 'Дней',
          admin: { width: '50%' },
        },
        {
          name: 'nights',
          type: 'number',
          min: 0,
          label: 'Ночей',
          admin: {
            width: '50%',
            description: 'Подставляется как дни минус один, можно переопределить',
          },
          hooks: { beforeValidate: [fillNights] },
        },
      ],
    },
    {
      name: 'priceSummary',
      type: 'ui',
      label: 'Итоговая цена',
      admin: {
        position: 'sidebar',
        components: { Field: '/cms/ui/EventPriceSummary#EventPriceSummary' },
      },
    },
    {
      name: 'priceRub',
      type: 'number',
      index: true,
      label: 'Цена в рублях',
      // Из формы поле убрано: править его нельзя, а сводку показывает priceSummary выше.
      // В БД остаётся — по нему сортирует и фильтрует каталог.
      admin: { hidden: true },
      hooks: { beforeChange: [computePriceRub] },
    },
  ],
}
