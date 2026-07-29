// Первым импортом: при standalone-запуске (вне Next) .env сам не подхватывается,
// а payload.config читает process.env уже на этапе импорта.
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import config from '@payload-config'

type GeoData = {
  regions: { slug: string; name: string }[]
  countries: { code: string; slug: string; name: string; region: string }[]
  cities: { slug: string; name: string; country: string }[]
}

type DemoEvent = {
  slug: string
  title: string
  category: string
  country: string
  city: string
  venueName: string
  address: string
  startDate: string
  endDate: string
  days: number
  basePrice: number
  currency: 'rub' | 'usd' | 'eur'
  lead: string
  included: string[]
  paidSeparately: { attribute: string; price: number; note?: string }[]
  ticketTypes: { name: string; price: number; description?: string; soldOut?: boolean }[]
  accommodations: {
    hotelName: string
    stars?: number
    roomName: string
    capacity?: number
    nights?: number
    mealPlan?: string
    price: number
    soldOut?: boolean
    amenities: string[]
  }[]
  itinerary: { day: number; title: string; description?: string }[]
}

type SeedCollection = 'regions' | 'countries' | 'cities' | 'attributes' | 'categories'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA = join(HERE, 'seed', 'data')
const geo: GeoData = JSON.parse(readFileSync(join(DATA, 'geo.json'), 'utf8'))
const attributes: { slug: string; [key: string]: unknown }[] = JSON.parse(
  readFileSync(join(DATA, 'attributes.json'), 'utf8'),
)
const categories: { slug: string; [key: string]: unknown }[] = JSON.parse(
  readFileSync(join(DATA, 'categories.json'), 'utf8'),
)
const demoEvents: DemoEvent[] = JSON.parse(readFileSync(join(DATA, 'events.json'), 'utf8'))

// Сгенерированные афиши: Payload копирует файл к себе в media, поэтому исходники
// лежат отдельно и в репозиторий не попадают.
const POSTERS = join(HERE, '..', '..', '.seed-posters')

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

/**
 * Стартовые курсы ЦБ на день написания сида. Помечены как `manual`: это не выгрузка,
 * а заглушка, чтобы каталог считал цены до первой синхронизации.
 */
const seedStartingRates = async (payload: Payload) => {
  const starting = [
    { currency: 'usd' as const, rate: 78.698 },
    { currency: 'eur' as const, rate: 89.6292 },
  ]

  const date = new Date(Date.UTC(2026, 6, 29)).toISOString()

  for (const { currency, rate } of starting) {
    const { totalDocs } = await payload.find({
      collection: 'exchangeRates',
      where: { currency: { equals: currency } },
      limit: 0,
      depth: 0,
    })

    // Курс уже ведётся — не перебиваем историю стартовым значением.
    if (totalDocs > 0) continue

    await payload.create({
      collection: 'exchangeRates',
      data: { date, currency, rate, source: 'manual' },
    })
    payload.logger.info(`Курс: ${currency} ${rate}`)
  }
}

/** Слаг → документ: демо-события ссылаются на справочники по слагам, а не по id. */
const mapBySlug = async (payload: Payload, collection: 'attributes' | 'cities') => {
  const { docs } = await payload.find({ collection, limit: 0, depth: 0 })

  return new Map(docs.map((doc) => [doc.slug as string, doc]))
}

/** Минимальный lexical-документ: одно описание одним абзацем. */
const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
})

const POSTER_COLORS = [
  ['#1e3a8a', '#0ea5e9'],
  ['#7c2d12', '#f59e0b'],
  ['#14532d', '#4ade80'],
  ['#4c1d95', '#c084fc'],
  ['#7f1d1d', '#fb7185'],
  ['#0f172a', '#38bdf8'],
  ['#134e4a', '#2dd4bf'],
  ['#581c87', '#e879f9'],
  ['#78350f', '#fbbf24'],
  ['#1e293b', '#94a3b8'],
]

/**
 * Афиша демо-события.
 *
 * Рисуем градиент с названием, а не тянем картинки из сети: сид должен отрабатывать
 * без интернета и без вопросов о лицензии на фотографии.
 */
const ensurePoster = async (payload: Payload, slug: string, title: string, index: number) => {
  const filename = `${slug}.jpg`

  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })

  if (docs[0]) return docs[0].id

  const [from, to] = POSTER_COLORS[index % POSTER_COLORS.length]

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <text x="80" y="780" font-family="Helvetica, Arial, sans-serif" font-size="64"
          font-weight="bold" fill="#ffffff">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
  </svg>`

  await mkdir(POSTERS, { recursive: true })
  const filePath = join(POSTERS, filename)
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(filePath)

  const media = await payload.create({
    collection: 'media',
    data: { alt: title },
    filePath,
  })

  payload.logger.info(`Афиша: ${filename}`)

  return media.id
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

  // Категории события. Слаги заданы явно: транслитерация дала бы «kontserty»
  // (ц → ts), а адрес /kategorii/koncerty читается привычнее.
  const eventCategories = await syncCollection(payload, 'categories', categories, {
    createOnly: true,
  })

  // Стартовый курс. Без него валютные события посчитались бы по нулевому курсу:
  // синхронизация с ЦБ придёт позже, а каталог должен работать сразу.
  // Заводим только на пустой коллекции — дальше историю ведёт синхронизация.
  await seedStartingRates(payload)

  // --- Демо-контент: события, на которых видно работу каталога ---

  const attributeBySlug = await mapBySlug(payload, 'attributes')
  const cityBySlug = await mapBySlug(payload, 'cities')

  for (const [index, demo] of demoEvents.entries()) {
    const countrySlug = byCode.get(demo.country)
    const country = countrySlug ? countries.get(countrySlug) : undefined
    const city = cityBySlug.get(demo.city)
    const category = eventCategories.get(demo.category)

    if (!country || !city || !category) {
      payload.logger.warn(`Пропущено ${demo.slug}: нет страны, города или категории`)
      continue
    }

    const cover = await ensurePoster(payload, demo.slug, demo.title, index)

    const data = {
      title: demo.title,
      slug: demo.slug,
      category: category.id,
      country: country.id,
      city: city.id,
      venueName: demo.venueName,
      address: demo.address,
      startDate: demo.startDate,
      endDate: demo.endDate,
      days: demo.days,
      basePrice: demo.basePrice,
      currency: demo.currency,
      description: paragraph(demo.lead),
      included: demo.included.map((slug) => attributeBySlug.get(slug)?.id).filter(Boolean),
      paidSeparately: demo.paidSeparately.map((row) => ({
        attribute: attributeBySlug.get(row.attribute)?.id,
        price: row.price,
        note: row.note,
      })),
      ticketTypes: demo.ticketTypes,
      accommodations: demo.accommodations.map((room) => ({
        ...room,
        amenities: room.amenities.map((slug) => attributeBySlug.get(slug)?.id).filter(Boolean),
      })),
      itinerary: demo.itinerary,
      photos: [cover],
      seo: { title: `${demo.title} — поездка с BSI Events`, description: demo.lead },
      status: 'published' as const,
    }

    const { docs } = await payload.find({
      collection: 'events',
      where: { slug: { equals: demo.slug } },
      limit: 1,
    })

    // Именно update, а не пропуск: демо-контент должен догонять правки сида,
    // иначе после смены схемы половина событий остаётся в старом виде.
    if (docs[0]) await payload.update({ collection: 'events', id: docs[0].id, data: data as never })
    else await payload.create({ collection: 'events', data: data as never })

    payload.logger.info(`Событие: ${demo.slug}`)
  }

  // Демо-события первой итерации: их схема (price + addons) больше не существует.
  for (const stale of ['sobytie-rubli-demo', 'sobytie-dollary-demo']) {
    const { docs } = await payload.find({
      collection: 'events',
      where: { slug: { equals: stale } },
      limit: 1,
    })

    if (docs[0]) {
      await payload.delete({ collection: 'events', id: docs[0].id })
      payload.logger.info(`Удалено устаревшее демо-событие: ${stale}`)
    }
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
