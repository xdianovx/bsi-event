import type { GlobalConfig } from 'payload'
import { recalcEventPrices } from '../hooks/recalcEventPrices'

// Курс здесь больше не хранится — он живёт историей в коллекции `exchangeRates`
// и приходит из ЦБ. В настройках остаётся то, что решает компания: наценка
// и режим синхронизации.
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Настройки',
  admin: { group: 'Настройки' },
  access: { read: () => true },
  fields: [
    {
      name: 'markupPercent',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      label: 'Наценка при конвертации, %',
      admin: { description: 'Накидывается сверх курса. К рублёвым ценам не применяется.' },
    },
    {
      name: 'ratesAutoUpdate',
      type: 'checkbox',
      defaultValue: true,
      label: 'Обновлять курс из ЦБ автоматически',
      admin: { description: 'Выключить, если курс ведётся вручную.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lastSyncAt',
          type: 'date',
          label: 'Последняя синхронизация',
          admin: {
            readOnly: true,
            width: '50%',
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
          },
        },
        {
          name: 'lastSyncStatus',
          type: 'text',
          label: 'Результат синхронизации',
          admin: {
            readOnly: true,
            width: '50%',
            description: 'Если здесь ошибка — цены считаются по последнему известному курсу.',
          },
        },
      ],
    },
  ],
  hooks: {
    // Наценка поменялась — рублёвые эквиваленты валютных событий протухли.
    afterChange: [recalcEventPrices],
  },
}
