import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { buildCatalogQuery, type CatalogParams } from '@/entities/event'
import { CatalogFilters } from '@/features/catalog-filters'
import { Page, Section } from '@/shared/ui'
import { EventCard } from '@/entities/event'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** searchParams приходят строками или массивами — берём первое значение. */
const toParams = (sp: Record<string, string | string[] | undefined>): CatalogParams => {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  return {
    region: first(sp.region),
    country: first(sp.country),
    city: first(sp.city),
    type: first(sp.type),
    dateFrom: first(sp.dateFrom),
    dateTo: first(sp.dateTo),
    minPrice: first(sp.minPrice),
    maxPrice: first(sp.maxPrice),
    sort: first(sp.sort),
    page: first(sp.page),
  }
}

const isFiltered = (p: CatalogParams) =>
  Boolean(
    p.region ||
      p.country ||
      p.city ||
      p.type ||
      p.dateFrom ||
      p.dateTo ||
      p.minPrice ||
      p.maxPrice,
  )

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const params = toParams(await searchParams)
  const filtered = isFiltered(params) || Boolean(params.page && params.page !== '1')

  return {
    title: 'Туры на события',
    description:
      'Каталог туров на концерты, спортивные матчи и гонки: билет, проживание и виза одним заказом.',
    alternates: { canonical: '/tury' },
    // Отфильтрованные выборки — это дубли одного и того же каталога.
    // В индекс пускаем только чистый /tury, остальное закрываем.
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = toParams(await searchParams)
  const payload = await getPayload({ config: await config })

  // Списки зависимые: выбран регион — страны сужаются, выбрана страна — города.
  // Сужение считается на сервере при отправке формы, клиентского стейта нет.
  const [{ docs: events, totalPages, page, totalDocs }, { docs: regions }, { docs: countries }, { docs: cities }] =
    await Promise.all([
      payload.find({ collection: 'events', ...buildCatalogQuery(params), depth: 2 }),
      payload.find({ collection: 'regions', sort: 'name', limit: 100, depth: 0 }),
      payload.find({
        collection: 'countries',
        where: params.region ? { 'region.slug': { equals: params.region } } : undefined,
        sort: 'name',
        limit: 200,
        depth: 0,
      }),
      payload.find({
        collection: 'cities',
        where: params.country ? { 'country.slug': { equals: params.country } } : undefined,
        sort: 'name',
        limit: 300,
        depth: 0,
      }),
    ])

  const filtered = isFiltered(params)

  /** Ссылка на страницу пагинации с сохранением активных фильтров. */
  const pageHref = (n: number) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v && k !== 'page' && qs.set(k, v))
    if (n > 1) qs.set('page', String(n))
    const s = qs.toString()
    return s ? `/tury?${s}` : '/tury'
  }

  return (
    <Page>
      <Section>
        <Typography className="text-accent tracking-[0.2em] uppercase" type="body-xs">
          Билет · отель · виза
        </Typography>
        <Typography.Heading className="text-balance" level={1}>
          Туры на события
        </Typography.Heading>
        <Typography className="max-w-2xl" color="muted">
          Выберите концерт, матч или гонку — поездку соберём целиком, от билета до визы.
        </Typography>
      </Section>

      <div>
        <CatalogFilters
          regions={regions.map((r) => ({ name: r.name, slug: r.slug }))}
          countries={countries.map((c) => ({ name: c.name, slug: c.slug }))}
          cities={cities.map((c) => ({ name: c.name, slug: c.slug }))}
          active={params}
          hasActiveFilters={filtered}
        />
      </div>

      {events.length === 0 ? (
        <Card>
          <Card.Header>
            <Card.Title>Под эти условия ничего нет</Card.Title>
            <Card.Description>
              Попробуйте расширить диапазон цены или выбрать другую страну.
            </Card.Description>
          </Card.Header>
          {filtered && (
            <Card.Footer>
              <Link href="/tury" className="link">
                Показать все туры
              </Link>
            </Card.Footer>
          )}
        </Card>
      ) : (
        <>
          <Typography color="muted" type="body-sm">
            Найдено: {totalDocs}
          </Typography>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        </>
      )}

      {totalPages > 1 && (
        /* Классы пагинации HeroUI, но элементы — настоящие ссылки. Штатный
           Pagination умеет только onPress: страницы стали бы кнопками, и
           поисковик перестал бы обходить каталог глубже первой. */
        <nav aria-label="Страницы каталога" className="pagination">
          <ul className="pagination__content mx-auto">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <li key={n} className="pagination__item">
                <Link
                  href={pageHref(n)}
                  aria-current={n === page ? 'page' : undefined}
                  data-active={n === page ? 'true' : undefined}
                  className="pagination__link"
                >
                  {n}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </Page>
  )
}
