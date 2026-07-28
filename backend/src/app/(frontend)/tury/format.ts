const CURRENCY_SIGNS: Record<string, string> = {
  rub: '₽',
  usd: '$',
  eur: '€',
}

export const formatPrice = (value: number, currency: string) =>
  `${new Intl.NumberFormat('ru-RU').format(value)} ${CURRENCY_SIGNS[currency] ?? ''}`.trim()

/**
 * «12 сент 2026» — ru-RU добавляет к году «г.», а к месяцу точку; на карточке
 * это лишний шум, поэтому собираем части вручную.
 */
export const formatDate = (iso?: string | null) => {
  if (!iso) return 'дата уточняется'

  const d = new Date(iso)
  const month = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d).replace('.', '')

  return `${String(d.getDate()).padStart(2, '0')} ${month} ${d.getFullYear()}`
}

/** «Италия, Милан» из связей события; город может быть не задан или не раскрыт. */
export const formatPlace = (
  country?: { name?: string | null } | number | null,
  city?: { name?: string | null } | number | null,
) =>
  [
    typeof country === 'object' && country ? country.name : null,
    typeof city === 'object' && city ? city.name : null,
  ]
    .filter(Boolean)
    .join(', ')
