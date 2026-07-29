import type { Payload, Where } from 'payload'
import type { Event } from '@/payload-types'

export const CATALOG_PAGE_SIZE = 12

const DEFAULT_SORT = '-startDate'

// Пользовательское имя сортировки → поле в БД. Цена сортируется по priceRub,
// иначе 1200 $ встало бы дешевле 5000 ₽.
const SORT_MAP: Record<string, string> = {
  price: 'priceRub',
  '-price': '-priceRub',
  date: 'startDate',
  '-date': '-startDate',
}

export type CatalogParams = {
  region?: string
  country?: string
  city?: string
  /** Слаги категорий: чекбоксы шлют параметр несколько раз. */
  category?: string[]
  dateFrom?: string
  dateTo?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  page?: string
}

export type CatalogQuery = {
  where: Where
  sort: string
  page: number
  limit: number
}

/** Число из query-строки; всё нечисловое отбрасываем — параметры приходят из URL. */
const toNumber = (raw?: string): number | undefined => {
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/** Диапазон для Where; undefined, если обе границы пусты — лишний ключ в where не нужен. */
const rangeOf = <T extends number | string>(min?: T, max?: T) => {
  const range: { greater_than_equal?: T; less_than_equal?: T } = {}
  if (min !== undefined) range.greater_than_equal = min
  if (max !== undefined) range.less_than_equal = max
  return Object.keys(range).length > 0 ? range : undefined
}

/**
 * Собирает аргументы payload.find для каталога из query-параметров страницы.
 * Черновики наружу не отдаём никогда — status подмешивается всегда.
 */
export const buildCatalogQuery = (params: CatalogParams): CatalogQuery => {
  const where: Where = { status: { equals: 'published' } }

  // Гео-уровни независимы: регион читается через страну, город — напрямую
  if (params.region) where['country.region.slug'] = { equals: params.region }
  if (params.country) where['country.slug'] = { equals: params.country }
  if (params.city) where['city.slug'] = { equals: params.city }
  // Мусорные слаги не отсеиваем: несуществующий просто не совпадёт ни с чем,
  // а лишний запрос к справочнику ради валидации не нужен.
  const categories = params.category?.filter(Boolean) ?? []
  if (categories.length > 0) where['category.slug'] = { in: categories }

  const price = rangeOf(toNumber(params.minPrice), toNumber(params.maxPrice))
  if (price) where.priceRub = price

  const date = rangeOf(params.dateFrom || undefined, params.dateTo || undefined)
  if (date) where.startDate = date

  const page = toNumber(params.page)

  return {
    where,
    sort: (params.sort && SORT_MAP[params.sort]) || DEFAULT_SORT,
    page: page && page >= 1 ? page : 1,
    limit: CATALOG_PAGE_SIZE,
  }
}

/**
 * Карточка товара по слагу. Черновики не отдаём — слаг угадывается,
 * и неопубликованное событие не должно открываться по прямой ссылке.
 */
export const getEventBySlug = async (payload: Payload, slug: string): Promise<Event | null> => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    depth: 2, // раскрываем country и photos для рендера карточки
    limit: 1,
  })

  return docs[0] ?? null
}
