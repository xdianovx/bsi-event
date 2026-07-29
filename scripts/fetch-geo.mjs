/**
 * Собирает справочник географии (континенты → страны → столицы) в
 * src/cms/seed/data/geo.json. Источник — Wikidata: там в одном месте есть коды
 * ISO 3166-1, русские названия и столицы.
 *
 *   node scripts/fetch-geo.mjs            — скачать и пересобрать
 *   node scripts/fetch-geo.mjs --offline  — пересобрать из кэша, без сети
 *
 * Ответы Wikidata кладутся в scripts/.geo-cache/ и не коммитятся: в репозиторий
 * идёт только собранный geo.json, чтобы сид не зависел от доступности сети.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify } from '../src/shared/lib/slugify.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.geo-cache')
const OUT = join(HERE, '..', 'src', 'cms', 'seed', 'data', 'geo.json')
const ENDPOINT = 'https://query.wikidata.org/sparql'
const UA = 'bsi-event-site-seed/1.0 (https://github.com/xdianovx/bsi-event)'

const QUERIES = {
  countries: `
    SELECT ?code ?nameRu ?nameEn ?contEn WHERE {
      ?c wdt:P297 ?rawCode .
      FILTER NOT EXISTS { ?c wdt:P576 ?dissolved }
      OPTIONAL { ?c rdfs:label ?ru . FILTER(lang(?ru)="ru") }
      OPTIONAL { ?c rdfs:label ?en . FILTER(lang(?en)="en") }
      OPTIONAL { ?c wdt:P30 ?cont . ?cont rdfs:label ?contL . FILTER(lang(?contL)="en") }
      BIND(LCASE(?rawCode) AS ?code)
      BIND(STR(?ru) AS ?nameRu) BIND(STR(?en) AS ?nameEn) BIND(STR(?contL) AS ?contEn)
    }`,
  capitals: `
    SELECT ?code ?nameRu ?nameEn WHERE {
      ?country wdt:P297 ?rawCode ; wdt:P36 ?city .
      FILTER NOT EXISTS { ?country wdt:P576 ?dissolved }
      OPTIONAL { ?city rdfs:label ?ru . FILTER(lang(?ru)="ru") }
      OPTIONAL { ?city rdfs:label ?en . FILTER(lang(?en)="en") }
      BIND(LCASE(?rawCode) AS ?code)
      BIND(STR(?ru) AS ?nameRu) BIND(STR(?en) AS ?nameEn)
    }`,
}

/** Континенты Wikidata → наши регионы. Антарктида не нужна: туров туда нет. */
const REGIONS = {
  Europe: { slug: 'evropa', name: 'Европа' },
  Eurasia: { slug: 'evropa', name: 'Европа' },
  Asia: { slug: 'aziya', name: 'Азия' },
  Africa: { slug: 'afrika', name: 'Африка' },
  'North America': { slug: 'severnaya-amerika', name: 'Северная Америка' },
  'South America': { slug: 'yuzhnaya-amerika', name: 'Южная Америка' },
  Oceania: { slug: 'okeaniya', name: 'Океания' },
  'Insular Oceania': { slug: 'okeaniya', name: 'Океания' },
}

/**
 * Трансконтинентальные страны Wikidata отдаёт с двумя континентами, и какой
 * придёт первым — не определено. Фиксируем выбор явно, иначе состав региона
 * будет меняться от запуска к запуску.
 */
const CONTINENT_BY_CODE = {
  ru: 'Europe',
  tr: 'Europe',
  ge: 'Europe',
  cy: 'Europe',
  az: 'Asia',
  am: 'Asia',
  kz: 'Asia',
  eg: 'Africa',
  ax: 'Europe', // Аландские острова: континент у Wikidata не проставлен
}

/**
 * Ручной разбор двух случаев: у страны несколько столиц (какая нужна — выбор
 * редакторский, а не фактический) либо столицы нет вовсе.
 */
const CAPITAL_BY_CODE = {
  za: 'Кейптаун', // из трёх столиц туристически осмысленна эта
  bo: 'Ла-Пас',
  lk: 'Коломбо',
  cy: 'Никосия',
  sz: 'Мбабане',
  ye: 'Сана',
  ps: 'Рамалла',
  ms: 'Брейдс',
  yt: 'Мамудзу',
  hk: 'Гонконг',
  mo: 'Макао',
  eh: 'Эль-Аюн',
  bq: 'Кралендейк',
  sj: 'Лонгйир',
}

/** Территории без постоянного населения — в каталоге туров им нечего делать. */
const SKIP = new Set([
  'aq', 'bv', 'hm', 'gs', 'tf', 'um', 'cp', 'dg', 'cq', 'tk', 'ac', 'ta',
])

const rows = async (name) => {
  const cached = join(CACHE, `${name}.json`)

  if (!process.argv.includes('--offline')) {
    const url = `${ENDPOINT}?query=${encodeURIComponent(QUERIES[name])}`
    const res = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
    })
    if (!res.ok) throw new Error(`Wikidata ${name}: HTTP ${res.status}`)
    mkdirSync(CACHE, { recursive: true })
    writeFileSync(cached, await res.text())
  }

  const json = JSON.parse(readFileSync(cached, 'utf8'))
  return json.results.bindings.map((b) =>
    Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])),
  )
}

const build = async () => {
  const [countryRows, capitalRows] = await Promise.all([rows('countries'), rows('capitals')])

  // Первая метка выигрывает, кроме случаев из CONTINENT_BY_CODE
  const continents = new Map()
  const names = new Map()
  for (const r of countryRows) {
    if (!names.has(r.code)) names.set(r.code, r.nameRu || r.nameEn)
    if (r.contEn && !continents.has(r.code)) continents.set(r.code, r.contEn)
  }

  const capitals = new Map()
  for (const r of capitalRows) {
    if (!capitals.has(r.code)) capitals.set(r.code, r.nameRu || r.nameEn)
  }

  const usedRegions = new Map()
  const countries = []
  const cities = []
  const skipped = []
  // Слаг уникален в пределах коллекции, а названия столиц повторяются
  // (Виктория, Сан-Хосе). Дубли разводим кодом страны.
  const citySlugs = new Set()

  for (const code of [...names.keys()].sort()) {
    if (SKIP.has(code)) continue

    const name = names.get(code)
    const continent = CONTINENT_BY_CODE[code] ?? continents.get(code)
    const region = REGIONS[continent]

    if (!name || !region) {
      skipped.push(`${code} (${name ?? '?'}): регион не определён`)
      continue
    }

    usedRegions.set(region.slug, region)
    countries.push({ code, slug: slugify(name), name, region: region.slug })

    const capital = CAPITAL_BY_CODE[code] ?? capitals.get(code)
    if (!capital) {
      skipped.push(`${code} (${name}): столица не найдена`)
      continue
    }

    let slug = slugify(capital)
    if (citySlugs.has(slug)) slug = `${slug}-${code}`
    citySlugs.add(slug)
    cities.push({ slug, name: capital, country: code })
  }

  const data = {
    regions: [...usedRegions.values()],
    countries,
    cities,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`)

  console.log(
    `geo.json: регионов ${data.regions.length}, стран ${countries.length}, городов ${cities.length}`,
  )
  if (skipped.length) console.log(`пропущено ${skipped.length}:\n  ${skipped.join('\n  ')}`)
}

build()
