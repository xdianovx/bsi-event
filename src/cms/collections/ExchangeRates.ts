import type { CollectionConfig } from 'payload'
import { normalizeDay } from '../hooks/normalizeDay'
import { recalcEventPrices } from '../hooks/recalcEventPrices'

/**
 * История курса валют. Хранится не последним значением, а списком по датам: когда
 * руководитель спрашивает, почему событие подорожало, ответ должен быть в админке,
 * а не в памяти менеджера.
 *
 * Записи заводятся синхронизацией с ЦБ и руками — источник помечен полем `source`,
 * в расчёте цены оба равноправны.
 */
export const ExchangeRates: CollectionConfig = {
  slug: 'exchangeRates',
  labels: { singular: 'Курс валюты', plural: 'Курсы валют' },
  admin: {
    group: 'Настройки',
    useAsTitle: 'date',
    defaultColumns: ['date', 'currency', 'rate', 'source'],
    description: 'История курса ЦБ. Цена события считается по последней записи.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  defaultSort: '-date',
  // Повторная синхронизация за тот же день должна обновлять запись, а не плодить дубли.
  indexes: [{ fields: ['date', 'currency'], unique: true }],
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      label: 'Дата курса',
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
        description: 'Дата, на которую ЦБ установил курс, а не дата загрузки.',
      },
      hooks: { beforeValidate: [normalizeDay] },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      index: true,
      label: 'Валюта',
      options: [
        { label: '$ Доллар', value: 'usd' },
        { label: '€ Евро', value: 'eur' },
      ],
    },
    {
      name: 'rate',
      type: 'number',
      required: true,
      min: 0,
      label: 'Рублей за единицу',
      admin: { description: 'Курс за одну единицу валюты, номинал ЦБ уже учтён.' },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      label: 'Источник',
      admin: { position: 'sidebar' },
      options: [
        { label: 'ЦБ РФ', value: 'cbr' },
        { label: 'Вручную', value: 'manual' },
      ],
    },
  ],
  hooks: {
    // Новый курс — рублёвые эквиваленты всех валютных событий протухли.
    afterChange: [recalcEventPrices],
  },
}
