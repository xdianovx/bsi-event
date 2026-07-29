import type { Metadata } from 'next'
import Link from 'next/link'
import { Button, Card, Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { geoUrl } from '@/entities/geo'
import { collectPopulatedGeo } from '@/entities/geo'
import type { Country } from '@/payload-types'
import { Breadcrumbs, Page, Section } from '@/shared/ui'
import { Flag, GeoTile, GeoTiles } from '@/entities/geo'

export const metadata: Metadata = {
  title: 'Направления',
  description:
    'Страны, куда мы организуем туры на концерты, спортивные матчи и гонки: билет, проживание и виза под ключ.',
  alternates: { canonical: '/napravleniya' },
}

const plural = (n: number, forms: [string, string, string]) => {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return forms[2]
  const mod10 = n % 10
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

const regionOf = (country: Country) => (typeof country.region === 'object' ? country.region : null)

export default async function DirectionsPage() {
  const payload = await getPayload({ config: await config })

  const [{ docs: countries }, populated] = await Promise.all([
    // Справочник целиком: 243 страны — это один запрос и одна страница,
    // отдельных пустых страниц он не порождает.
    payload.find({ collection: 'countries', sort: 'name', limit: 500, depth: 1 }),
    collectPopulatedGeo(payload),
  ])

  const withTours = countries.filter((country) => populated.countries.has(country.id))

  // Группировка по региону: порядок регионов — по числу стран с турами,
  // чтобы наполненное было сверху
  const byRegion = new Map<
    string,
    { name: string; slug: string; countries: Country[]; withTours: number; hasTours: boolean }
  >()
  const withoutRegion: Country[] = []

  for (const country of countries) {
    const region = regionOf(country)
    if (!region) {
      withoutRegion.push(country)
      continue
    }

    const group = byRegion.get(region.slug) ?? {
      name: region.name,
      slug: region.slug,
      countries: [],
      withTours: 0,
      hasTours: false,
    }

    group.countries.push(country)
    if (populated.countries.has(country.id)) {
      group.withTours += 1
      group.hasTours = true
    }
    byRegion.set(region.slug, group)
  }

  const groups = [...byRegion.values()].sort(
    (a, b) => b.withTours - a.withTours || a.name.localeCompare(b.name, 'ru'),
  )

  return (
    <Page>
      {/* Блок 1 — крошки и заголовок */}
      <Section>
        <Breadcrumbs items={[{ label: 'Направления' }]} />
        <Typography.Heading level={1}>Направления</Typography.Heading>
        <Typography className="max-w-2xl" color="muted">
        {withTours.length > 0
          ? `Сейчас туры есть в ${withTours.length} ${plural(withTours.length, ['стране', 'странах', 'странах'])}. Остальные страны в списке ниже — напишите нам, если нужна поездка туда.`
          : 'Скоро здесь появятся страны, куда мы возим на события.'}
        </Typography>
      </Section>

      {/* Блок 2 — куда летим сейчас: только страны с турами */}
      {withTours.length > 0 && (
        <Section>
          <Typography.Heading level={2}>Куда летим сейчас</Typography.Heading>
          <GeoTiles>
            {withTours.map((country) => {
              const region = regionOf(country)
              const count = populated.eventsByCountry.get(country.id) ?? 0

              return (
                <GeoTile
                  key={country.id}
                  href={region ? geoUrl.country(region.slug, country.slug) : `/tury?country=${country.slug}`}
                  name={country.name}
                  flag={country.flag}
                  code={country.code}
                  note={`${count} ${plural(count, ['тур', 'тура', 'туров'])}`}
                />
              )
            })}
          </GeoTiles>
        </Section>
      )}

      {/* Блок 3 — весь справочник по регионам. Страна без туров показана,
          но не ссылка: её страницы не существует, вести на 404 нельзя. */}
      <Section>
        <Typography.Heading level={2}>Все страны</Typography.Heading>

        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <div key={group.slug} className="flex flex-col gap-3">
              <Typography.Heading level={3}>
                {group.hasTours ? (
                  <Link href={geoUrl.region(group.slug)} className="link">
                    {group.name}
                  </Link>
                ) : (
                  group.name
                )}
              </Typography.Heading>

              <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.countries.map((country) => {
                  const hasTours = populated.countries.has(country.id)

                  return (
                    <li key={country.id} className="flex items-center gap-3 py-1">
                      <Flag flag={country.flag} code={country.code} name={country.name} />
                      {hasTours ? (
                        <Link href={geoUrl.country(group.slug, country.slug)} className="link">
                          {country.name}
                        </Link>
                      ) : (
                        <span className="text-muted">{country.name}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {withoutRegion.length > 0 && (
            <div className="flex flex-col gap-3">
              <Typography.Heading level={3}>Без региона</Typography.Heading>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {withoutRegion.map((country) => (
                  <li key={country.id} className="flex items-center gap-3 py-1">
                    <Flag flag={country.flag} code={country.code} name={country.name} />
                    <span className="text-muted">{country.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* Блок 4 — призыв к действию */}
      <Card>
        <Card.Header>
          <Card.Title>Не нашли направление?</Card.Title>
          <Card.Description>
            Соберём поездку на любое событие: билет, перелёт, отель и виза одним заказом.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button size="lg">Оставить заявку</Button>
        </Card.Footer>
      </Card>
    </Page>
  )
}
