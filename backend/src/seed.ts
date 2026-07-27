// Первым импортом: при standalone-запуске (вне Next) .env сам не подхватывается,
// а payload.config читает process.env уже на этапе импорта.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const run = async () => {
  const payload = await getPayload({ config })

  const existingCountry = await payload.find({
    collection: 'countries',
    where: { slug: { equals: 'italia' } },
    limit: 1,
  })
  const country =
    existingCountry.docs[0] ??
    (await payload.create({ collection: 'countries', data: { name: 'Италия', slug: 'italia' } }))

  const demos = [
    {
      title: 'Демо-событие: рублёвая цена',
      slug: 'sobytie-rubli-demo',
      type: 'concert' as const,
      city: 'Милан',
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
      city: 'Монца',
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
