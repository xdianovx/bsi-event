import type { CollectionConfig } from 'payload'
import { seoField } from '../fields/seo'
import { generateSlug } from '../hooks/generateSlug'
import { computeEventPrice } from '../hooks/computeEventPrice'
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
    components: {
      // Слева от «Сохранить»: проверить результат на сайте хочется ровно в тот момент,
      // когда рука тянется сохранять.
      edit: { beforeDocumentControls: ['/cms/ui/ViewOnSite#ViewOnSite'] },
    },
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
            {
              type: 'row',
              fields: [
                {
                  name: 'venueName',
                  type: 'text',
                  label: 'Площадка',
                  admin: { width: '50%', description: 'Стадион, арена, концертный зал' },
                },
                {
                  name: 'address',
                  type: 'text',
                  label: 'Адрес площадки',
                  admin: { width: '50%' },
                },
              ],
            },
            { name: 'description', type: 'richText', label: 'Описание' },
          ],
        },
        {
          label: 'Цены',
          description: 'Все цены — в валюте события. Покупатель видит рубли по курсу ЦБ',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'basePrice',
                  type: 'number',
                  required: true,
                  min: 0,
                  label: 'Базовая часть',
                  admin: {
                    width: '50%',
                    description: 'Перелёт, трансфер, сопровождение — то, что входит всегда',
                  },
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
              name: 'ticketTypes',
              type: 'array',
              label: 'Категории билета',
              admin: {
                initCollapsed: true,
                description: 'Фан-зона, трибуна, VIP. Цена — сверх базовой части',
                components: { RowLabel: '/cms/ui/RowLabels#TicketRowLabel' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      required: true,
                      label: 'Название',
                      admin: { width: '60%' },
                    },
                    {
                      name: 'price',
                      type: 'number',
                      required: true,
                      min: 0,
                      label: 'Цена',
                      admin: { width: '40%' },
                    },
                  ],
                },
                { name: 'description', type: 'textarea', label: 'Что за место' },
                { name: 'soldOut', type: 'checkbox', label: 'Нет мест', defaultValue: false },
              ],
            },
            {
              name: 'accommodations',
              type: 'array',
              label: 'Размещение',
              admin: {
                initCollapsed: true,
                description: 'Варианты номеров. Цена — сверх базовой части',
                components: { RowLabel: '/cms/ui/RowLabels#AccommodationRowLabel' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'hotelName',
                      type: 'text',
                      required: true,
                      label: 'Отель',
                      admin: { width: '70%' },
                    },
                    {
                      name: 'stars',
                      type: 'number',
                      min: 1,
                      max: 5,
                      label: 'Звёзды',
                      admin: { width: '30%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'roomName',
                      type: 'text',
                      required: true,
                      label: 'Номер',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'capacity',
                      type: 'number',
                      min: 1,
                      label: 'Мест',
                      admin: { width: '25%' },
                    },
                    {
                      name: 'nights',
                      type: 'number',
                      min: 1,
                      label: 'Ночей',
                      admin: { width: '25%', description: 'Если заезд короче поездки' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'mealPlan',
                      type: 'text',
                      label: 'Питание',
                      admin: { width: '50%', description: 'Завтраки, полупансион, без питания' },
                    },
                    {
                      name: 'price',
                      type: 'number',
                      required: true,
                      min: 0,
                      label: 'Цена',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  name: 'amenities',
                  type: 'relationship',
                  relationTo: 'attributes',
                  hasMany: true,
                  label: 'Удобства',
                  // Тот же справочник, что и состав события: у «Питания» и «Отеля»
                  // область включает «номер».
                  filterOptions: { scope: { contains: 'room' } },
                },
                { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, label: 'Фото' },
                { name: 'soldOut', type: 'checkbox', label: 'Нет мест', defaultValue: false },
              ],
            },
          ],
        },
        {
          label: 'Состав',
          description: 'Что входит в цену и что докупается отдельно',
          fields: [
            {
              name: 'included',
              type: 'relationship',
              relationTo: 'attributes',
              hasMany: true,
              label: 'Включено',
              admin: {
                description:
                  'Иконки на карточке и фильтры каталога берутся отсюда. Есть номера — отметьте «Отель»',
              },
              filterOptions: { scope: { contains: 'tour' } },
            },
            {
              name: 'paidSeparately',
              type: 'array',
              label: 'Оплачивается отдельно',
              admin: {
                initCollapsed: true,
                description: 'Покупатель добирает это галочками на странице события',
                components: { RowLabel: '/cms/ui/RowLabels#PaidSeparatelyRowLabel' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'attribute',
                      type: 'relationship',
                      relationTo: 'attributes',
                      required: true,
                      label: 'Что именно',
                      admin: { width: '60%' },
                      filterOptions: { scope: { contains: 'tour' } },
                    },
                    {
                      name: 'price',
                      type: 'number',
                      required: true,
                      min: 0,
                      label: 'Цена',
                      admin: { width: '40%' },
                    },
                  ],
                },
                { name: 'note', type: 'text', label: 'Примечание' },
              ],
            },
          ],
        },
        {
          label: 'Программа',
          description: 'Расписание по дням — так раскладываются многодневные турниры',
          fields: [
            {
              name: 'itinerary',
              type: 'array',
              label: 'Программа по дням',
              admin: {
                initCollapsed: true,
                components: { RowLabel: '/cms/ui/RowLabels#ItineraryRowLabel' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'day',
                      type: 'number',
                      required: true,
                      min: 1,
                      label: 'День',
                      admin: { width: '20%' },
                    },
                    {
                      name: 'title',
                      type: 'text',
                      required: true,
                      label: 'Заголовок',
                      admin: { width: '80%' },
                    },
                  ],
                },
                { name: 'description', type: 'textarea', label: 'Что происходит' },
                { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото' },
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
          fields: [
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              label: 'Адрес страницы',
              admin: {
                description: 'Латиницей, автогенерируется из названия, можно переопределить',
              },
              hooks: { beforeValidate: [generateSlug('title')] },
            },
            seoField,
          ],
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
    // Вычисляемые поля. Из формы убраны: править их нельзя, сводку показывает
    // priceSummary. В БД остаются — по priceRub сортирует и фильтрует каталог.
    {
      name: 'priceFrom',
      type: 'number',
      label: 'Цена «от», в валюте события',
      admin: { hidden: true },
    },
    {
      name: 'priceRub',
      type: 'number',
      index: true,
      label: 'Цена «от», в рублях',
      admin: { hidden: true },
    },
  ],
  hooks: { beforeChange: [computeEventPrice] },
}
