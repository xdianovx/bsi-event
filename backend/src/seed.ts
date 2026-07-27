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

  const existingTariffs = await payload.find({
    collection: 'events',
    where: { slug: { equals: 'sobytie-s-tarifami-demo' } },
    limit: 1,
  })
  if (existingTariffs.docs.length === 0) {
    await payload.create({
      collection: 'events',
      data: {
        title: 'Демо-событие: готовые тарифы',
        slug: 'sobytie-s-tarifami-demo',
        type: 'concert',
        country: country.id,
        pricingType: 'tariffs',
        tariffs: [
          { title: 'Только билет', price: 5000, includes: [{ item: 'Билет на событие' }] },
          { title: 'Билет + отель', price: 15000, includes: [{ item: 'Билет' }, { item: 'Отель' }] },
        ],
        status: 'published',
      },
    })
    payload.logger.info('Seeded: sobytie-s-tarifami-demo')
  }

  const existingAddons = await payload.find({
    collection: 'events',
    where: { slug: { equals: 'sobytie-s-dopkami-demo' } },
    limit: 1,
  })
  if (existingAddons.docs.length === 0) {
    await payload.create({
      collection: 'events',
      data: {
        title: 'Демо-событие: билет + допки',
        slug: 'sobytie-s-dopkami-demo',
        type: 'sport',
        country: country.id,
        pricingType: 'base+addons',
        basePrice: 3000,
        addons: [
          { label: 'Трансфер', price: 1000, type: 'transfer' },
          { label: 'Страховка', price: 500, type: 'insurance' },
        ],
        status: 'published',
      },
    })
    payload.logger.info('Seeded: sobytie-s-dopkami-demo')
  }

  process.exit(0)
}

run()
