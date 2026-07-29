import type { FieldHook } from 'payload'

/**
 * Срезает время у даты, оставляя полночь UTC.
 *
 * Уникальность курса держится на паре (дата, валюта), а датапикер и код пишут в поле
 * полноценный timestamp. Без нормализации две записи за один день отличались бы часами
 * и обе пролезли бы мимо уникального индекса.
 */
export const normalizeDay: FieldHook = ({ value }) => {
  if (!value) return value

  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) return value

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  ).toISOString()
}
