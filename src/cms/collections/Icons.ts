import type { CollectionConfig } from 'payload'

/**
 * Иконки интерфейса отдельно от медиатеки. Причина не в порядке, а в валидации:
 * ограничить формат фильтром на поле нельзя — файл к этому моменту уже лежит
 * в коллекции, и отказ приходит на связь, а не на загрузку. Ограничение
 * задаётся на коллекции, а `media` ограничивать нельзя — туда грузятся фото.
 *
 * Второй повод: фотографиям дальше понадобятся imageSizes и WebP, иконкам они
 * вредны — sharp растрирует SVG и превращает вектор в мыло.
 */
export const Icons: CollectionConfig = {
  slug: 'icons',
  labels: { singular: 'Иконка', plural: 'Иконки' },
  admin: { useAsTitle: 'alt', group: 'Справочники', defaultColumns: ['alt', 'filename'] },
  access: { read: () => true },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Описание',
      admin: { description: 'Что изображено. Используется как подпись для скринридеров.' },
    },
  ],
  upload: {
    mimeTypes: ['image/svg+xml'],
  },
}
