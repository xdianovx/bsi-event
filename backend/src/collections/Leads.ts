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
