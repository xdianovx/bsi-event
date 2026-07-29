'use client'

import { useFormFields } from '@payloadcms/ui'

const SIGN: Record<string, string> = { rub: '₽', usd: '$', eur: '€' }

const format = (value: number, currency: string) =>
  `${value.toLocaleString('ru-RU')} ${SIGN[currency] ?? currency}`

/**
 * Сводка цены в правой колонке: что ввёл менеджер и во что это превратилось для покупателя.
 *
 * Само поле `priceRub` из формы убрано — редактировать его нельзя, а место в сайдбаре
 * оно занимало как полноценное поле. Здесь та же цифра одной строкой и с пояснением,
 * откуда она взялась.
 */
export const EventPriceSummary = () => {
  const price = useFormFields(([fields]) => fields.price?.value as number | undefined)
  const currency = useFormFields(([fields]) => fields.currency?.value as string | undefined)
  const priceRub = useFormFields(([fields]) => fields.priceRub?.value as number | undefined)

  if (typeof price !== 'number') {
    return <p className="field-description">Цена появится здесь, когда заполните вкладку «Цены».</p>
  }

  const isForeign = currency && currency !== 'rub'

  return (
    <div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
        {typeof priceRub === 'number' ? format(priceRub, 'rub') : '—'}
      </div>
      {isForeign && (
        <p className="field-description">
          {format(price, currency)} по курсу ЦБ с наценкой из настроек. Каталог сортирует по
          рублёвой цене.
        </p>
      )}
      {!isForeign && <p className="field-description">Цена в рублях, курс не применяется.</p>}
    </div>
  )
}
