import type { Field } from 'payload'

// Переиспользуемый SEO-блок. Фронт читает его в generateMetadata:
// уникальные Title/Description, canonical и noindex против дублей фильтров.
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    { name: 'title', type: 'text', label: 'Meta Title' },
    { name: 'description', type: 'textarea', label: 'Meta Description' },
    {
      name: 'noindex',
      type: 'checkbox',
      label: 'Скрыть от индексации',
      defaultValue: false,
    },
  ],
}
