import type { CollectionConfig } from 'payload'
import { notifyNewLead } from '../hooks/notifyNewLead'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'name',
    group: 'Заявки',
    defaultColumns: ['name', 'phone', 'event', 'source', 'processed', 'createdAt'],
  },
  access: {
    // Форма на сайте создаёт лид анонимно; читать/править — только админы.
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: { afterChange: [notifyNewLead] },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Имя' },
    { name: 'phone', type: 'text', required: true, label: 'Телефон' },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      label: 'Событие',
    },
    {
      // Копия состава на момент заявки, а не ссылка на текущие цены события:
      // прайс и курс потом поменяются, а заявка должна помнить свои.
      name: 'orderItems',
      type: 'array',
      label: 'Состав заказа',
      admin: {
        description: 'Что выбрал покупатель. Снимок на момент заявки, пересчёту не подлежит.',
      },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Позиция' },
        { name: 'price', type: 'number', required: true, label: 'Цена' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'orderTotal',
          type: 'number',
          label: 'Итого',
          admin: { width: '50%' },
        },
        {
          name: 'orderCurrency',
          type: 'select',
          label: 'Валюта заказа',
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
      name: 'source',
      type: 'text',
      label: 'Источник',
      admin: { description: 'UTM-метка или страница, с которой пришла заявка' },
    },
    {
      name: 'processed',
      type: 'checkbox',
      label: 'Обработана',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
