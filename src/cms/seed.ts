// Первым импортом: при standalone-запуске (вне Next) .env сам не подхватывается,
// а payload.config читает process.env уже на этапе импорта.
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

type GeoData = {
  regions: { slug: string; name: string }[]
  countries: { code: string; slug: string; name: string; region: string }[]
  cities: { slug: string; name: string; country: string }[]
}

type SeedCollection = 'regions' | 'countries' | 'cities' | 'attributes'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA = join(HERE, 'seed', 'data')
const geo: GeoData = JSON.parse(readFileSync(join(DATA, 'geo.json'), 'utf8'))
const attributes: { slug: string; [key: string]: unknown }[] = JSON.parse(
  readFileSync(join(DATA, 'attributes.json'), 'utf8'),
)

/**
 * Заводит недостающие документы и дописывает поля существующим, но сначала
 * читает коллекцию целиком: справочник — это сотни записей, и проверять
 * каждую отдельным find значит сделать тысячу запросов вместо одного.
 *
 * `createOnly` — для справочников, которые правит контент-менеджер: там сид
 * только заполняет пустую базу, а переписывать чужие правки при каждом
 * прогоне он не должен.
 */
const syncCollection = async (
  payload: Payload,
  collection: SeedCollection,
  rows: { slug: string; [key: string]: unknown }[],
  { createOnly = false }: { createOnly?: boolean } = {},
) => {
  const { docs } = await payload.find({ collection, limit: 0, depth: 0 })
  const bySlug = new Map(docs.map((doc) => [doc.slug as string, doc]))

  let created = 0
  let updated = 0

  for (const row of rows) {
    const existing = bySlug.get(row.slug)

    if (!existing) {
      const doc = await payload.create({ collection, data: row as never })
      bySlug.set(row.slug, doc)
      created += 1
      continue
    }

    if (createOnly) continue

    // Обновляем только при расхождении: лишний update дёргает хуки и версии
    const stale = Object.entries(row).some(
      ([key, value]) => key !== 'slug' && existing[key as keyof typeof existing] !== value,
    )
    if (stale) {
      const doc = await payload.update({ collection, id: existing.id, data: row as never })
      bySlug.set(row.slug, doc)
      updated += 1
    }
  }

  payload.logger.info(`${collection}: создано ${created}, обновлено ${updated}, всего ${rows.length}`)
  return bySlug
}

const run = async () => {
  const payload = await getPayload({ config })

  const regions = await syncCollection(payload, 'regions', geo.regions)

  const countries = await syncCollection(
    payload,
    'countries',
    geo.countries.map(({ region, ...rest }) => ({ ...rest, region: regions.get(region)?.id })),
  )

  const byCode = new Map(geo.countries.map((c) => [c.code, c.slug]))
  await syncCollection(
    payload,
    'cities',
    geo.cities.map(({ country, ...rest }) => ({
      ...rest,
      country: countries.get(byCode.get(country) ?? '')?.id,
    })),
  )

  // Стартовый набор атрибутов события. Иконки не грузим: их подбирает контент-менеджер,
  // а атрибут без иконки выводится названием — так решено в PRD.
  await syncCollection(payload, 'attributes', attributes, { createOnly: true })

  // --- Демо-контент: события, на которых видно работу каталога ---

  const italy = countries.get('italiya')
  if (!italy) throw new Error('В справочнике нет Италии — демо-события привязать не к чему')

  const demoCities = await syncCollection(payload, 'cities', [
    { slug: 'milan', name: 'Милан', country: italy.id },
    { slug: 'moncza', name: 'Монца', country: italy.id },
  ])

  const demos = [
    {
      title: 'Демо-событие: рублёвая цена',
      slug: 'sobytie-rubli-demo',
      type: 'concert' as const,
      city: demoCities.get('milan')!.id,
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
      city: demoCities.get('moncza')!.id,
      startDate: '2026-10-04T14:00:00.000Z',
      price: 300,
      currency: 'usd' as const,
      addons: [{ label: 'Экскурсия', price: 50, type: 'excursion' }],
    },
  ]

  for (const demo of demos) {
    const data = { ...demo, country: italy.id, status: 'published' as const }
    const { docs } = await payload.find({
      collection: 'events',
      where: { slug: { equals: demo.slug } },
      limit: 1,
    })

    // Именно update, а не пропуск: у существующих демо-событий страна и город
    // могли остаться от старого справочника, где слаг Италии был другим.
    if (docs[0]) await payload.update({ collection: 'events', id: docs[0].id, data })
    else await payload.create({ collection: 'events', data })

    payload.logger.info(`Событие: ${demo.slug}`)
  }

  // Справочник до этой версии заполнялся вручную и слаги были на глаз
  // («italia» вместо транслитерации). Осиротевшие записи удаляем, иначе
  // страна двоится в админке и в фильтрах.
  const { docs: legacy } = await payload.find({
    collection: 'countries',
    where: { slug: { equals: 'italia' } },
    limit: 1,
  })
  if (legacy[0]) {
    await payload.delete({ collection: 'countries', id: legacy[0].id })
    payload.logger.info('Удалена устаревшая запись страны: italia')
  }

  process.exit(0)
}

run()
