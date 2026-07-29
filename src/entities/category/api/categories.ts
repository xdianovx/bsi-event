import type { Payload } from 'payload'
import type { Category } from '@/payload-types'

export const categoryUrl = {
  hub: () => '/kategorii',
  item: (slug: string) => `/kategorii/${slug}`,
}

/** Категория по слагу. `depth: 1` — раскрываем иконку, ради неё и запрос. */
export const getCategory = async (payload: Payload, slug: string): Promise<Category | null> => {
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  return docs[0] ?? null
}

/** Справочник целиком: три записи, сортировка задана коллекцией. */
export const getCategories = async (payload: Payload): Promise<Category[]> => {
  const { docs } = await payload.find({ collection: 'categories', limit: 0, depth: 1 })
  return docs
}

export type PopulatedCategories = {
  /** id категорий, у которых есть хотя бы одно опубликованное событие. */
  ids: Set<number>
  /** Сколько событий в категории — для подписей в списках. */
  counts: Map<number, number>
}

/**
 * Отвечает на вопрос «есть ли что показывать». Категория без событий — пустая
 * страница: посетителю бесполезна, а поисковику это сигнал низкого качества,
 * который бьёт по всему домену. Тот же приём, что у географии.
 */
export const collectPopulatedCategories = async (
  payload: Payload,
): Promise<PopulatedCategories> => {
  const { docs } = await payload.find({
    collection: 'events',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })

  const counts = new Map<number, number>()

  for (const event of docs) {
    const id = typeof event.category === 'object' ? event.category?.id : event.category
    if (typeof id === 'number') counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return { ids: new Set(counts.keys()), counts }
}
