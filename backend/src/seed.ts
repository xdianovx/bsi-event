// Первым импортом: при standalone-запуске (вне Next) .env сам не подхватывается,
// а payload.config читает process.env уже на этапе импорта.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const run = async () => {
  const payload = await getPayload({ config })

  /**
   * Приводит документ к описанному состоянию: создаёт или дописывает поля
   * существующему. Просто «создать, если нет» мало — на уже заведённой записи
   * новые связи молча не появились бы.
   */
  const upsert = async (
    collection: 'regions' | 'countries' | 'cities',
    slug: string,
    data: Record<string, unknown>,
  ): Promise<{ id: number }> => {
    const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
    const existing = found.docs[0]

    // Каст на результате, а не на аргументах: с `as never` в аргументах TS
    // выбирает перегрузку массового update и теряет id в возвращаемом типе.
    if (existing) {
      return (await payload.update({
        collection,
        id: existing.id,
        data: data as never,
      })) as { id: number }
    }

    return (await payload.create({
      collection,
      data: { ...data, slug } as never,
    })) as { id: number }
  }

  const region = await upsert('regions', 'evropa', { name: 'Европа' })
  const country = await upsert('countries', 'italia', { name: 'Италия', region: region.id })
  const milan = await upsert('cities', 'milan', { name: 'Милан', country: country.id })
  const monza = await upsert('cities', 'moncza', { name: 'Монца', country: country.id })

  const demos = [
    {
      title: 'Демо-событие: рублёвая цена',
      slug: 'sobytie-rubli-demo',
      type: 'concert' as const,
      city: milan.id,
      startDate: '2026-09-12T19:00:00.000Z',
      price: 15000,
      currency: 'rub' as const,
      addons: [
        { label: 'Трансфер', price: 1000, type: 'transfer' },
        { label: 'Страховка', price: 500, type: 'insurance' },
      ],
    },
    {
      // В валюте — чтобы было видно работу конвертации и сортировки каталога
      title: 'Демо-событие: цена в долларах',
      slug: 'sobytie-dollary-demo',
      type: 'sport' as const,
      city: monza.id,
      startDate: '2026-10-04T14:00:00.000Z',
      price: 300,
      currency: 'usd' as const,
      addons: [{ label: 'Экскурсия', price: 50, type: 'excursion' }],
    },
  ]

  for (const demo of demos) {
    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: demo.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) continue

    await payload.create({
      collection: 'events',
      data: { ...demo, country: country.id, status: 'published' },
    })
    payload.logger.info(`Seeded: ${demo.slug}`)
  }

  process.exit(0)
}

run()
