import type { GlobalConfig } from 'payload'

// Курсы вводятся вручную. Позже сюда встанет загрузка из ЦБ РФ — подменится
// только источник цифры, формула и хуки останутся прежними (issue #21).
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Настройки',
  admin: { group: 'Настройки' },
  access: { read: () => true },
  fields: [
    {
      name: 'rates',
      type: 'group',
      label: 'Курсы валют, ₽ за единицу',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'usd',
              type: 'number',
              required: true,
              defaultValue: 100,
              label: 'Доллар',
              admin: { width: '50%' },
            },
            {
              name: 'eur',
              type: 'number',
              required: true,
              defaultValue: 110,
              label: 'Евро',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'markupPercent',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      label: 'Наценка при конвертации, %',
      admin: { description: 'Накидывается сверх курса. К рублёвым ценам не применяется.' },
    },
  ],
  hooks: {
    // Курс поменялся — рублёвые эквиваленты всех событий протухли. Без пересчёта
    // каталог продолжил бы сортировать и фильтровать по прошлому курсу молча.
    afterChange: [
      async ({ req }) => {
        const { docs } = await req.payload.find({
          collection: 'events',
          limit: 0,
          depth: 0,
          req,
        })

        for (const event of docs) {
          await req.payload.update({
            collection: 'events',
            id: event.id,
            data: { price: event.price },
            req,
          })
        }
      },
    ],
  },
}
