import type { Payload } from 'payload'

/**
 * Категория для тестовых событий: поле обязательное, а заводить свою в каждом
 * файле значит плодить записи в общей тестовой БД. Берём сидовую, если она есть.
 */
export const ensureCategory = async (payload: Payload): Promise<number> => {
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'koncerty' } },
    limit: 1,
    depth: 0,
  })

  if (docs[0]) return docs[0].id

  const created = await payload.create({
    collection: 'categories',
    data: { name: 'Концерты', slug: 'koncerty' },
  })

  return created.id
}
