import type { CollectionConfig } from 'payload'

// Отзывы → фронт агрегирует в Schema.org AggregateRating (см. requirements/seo).
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Отзыв', plural: 'Отзывы' },
  admin: { useAsTitle: 'author', group: 'Контент', defaultColumns: ['author', 'rating', 'tour'] },
  access: { read: () => true },
  fields: [
    { name: 'author', type: 'text', required: true, label: 'Автор' },
    { name: 'text', type: 'textarea', required: true, label: 'Текст' },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: 'Рейтинг (1–5)',
    },
    {
      name: 'tour',
      type: 'relationship',
      relationTo: 'tours',
      label: 'Тур',
    },
  ],
}
