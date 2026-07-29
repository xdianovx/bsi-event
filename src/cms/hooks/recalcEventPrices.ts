import type { PayloadRequest } from 'payload'

/**
 * Пересчитывает рублёвые цены событий после смены курса или наценки.
 *
 * Без пересчёта каталог продолжил бы сортировать и фильтровать по прошлому курсу молча:
 * `priceRub` хранится в БД, потому что по виртуальному полю Postgres не отсортирует.
 *
 * Рублёвые события пропускаем — курс на них не влияет, а на объёме это половина каталога.
 * Идём страницами: событий со временем станет больше, чем влезает в один find.
 */
export const recalcEventPrices = async ({ req }: { req: PayloadRequest }) => {
  let page = 1

  for (;;) {
    const { docs, hasNextPage } = await req.payload.find({
      collection: 'events',
      where: { currency: { not_equals: 'rub' } },
      limit: 100,
      page,
      depth: 0,
      req,
    })

    for (const event of docs) {
      // Пустой data: цену пересчитает хук поля, ему достаточно самого факта записи.
      await req.payload.update({ collection: 'events', id: event.id, data: {}, req })
    }

    if (!hasNextPage) break
    page += 1
  }
}
