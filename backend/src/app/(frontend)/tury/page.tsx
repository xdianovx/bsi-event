import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { buildCatalogQuery, type CatalogParams } from '@/lib/catalog'
import { CatalogFilters } from './CatalogFilters'
import { EventCard } from './EventCard'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** searchParams приходят строками или массивами — берём первое значение. */
const toParams = (sp: Record<string, string | string[] | undefined>): CatalogParams => {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  return {
    country: first(sp.country),
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
  Boolean(p.country || p.type || p.dateFrom || p.dateTo || p.minPrice || p.maxPrice)

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

  const [{ docs: events, totalPages, page, totalDocs }, { docs: countries }] = await Promise.all([
    payload.find({ collection: 'events', ...buildCatalogQuery(params), depth: 1 }),
    payload.find({ collection: 'countries', sort: 'name', limit: 100, depth: 0 }),
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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="text-accent mb-3 text-xs tracking-[0.2em] uppercase">
          Билет · отель · виза
        </p>
        <h1 className="text-3xl leading-tight font-extrabold text-balance sm:text-5xl">
          Туры на события
        </h1>
        <p className="text-muted mt-4 max-w-2xl text-lg">
          Выберите концерт, матч или гонку — поездку соберём целиком, от билета до визы.
        </p>
      </header>

      <div className="mb-8">
        <CatalogFilters
          countries={countries.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
          active={params}
          hasActiveFilters={filtered}
        />
      </div>

      {events.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center">
          <p className="text-lg font-semibold">Под эти условия ничего нет</p>
          <p className="text-muted mt-2">
            Попробуйте расширить диапазон цены или выбрать другую страну.
          </p>
          {filtered && (
            <Link href="/tury" className="text-accent mt-4 inline-block underline underline-offset-4">
              Показать все туры
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-muted mb-4 text-xs tracking-widest uppercase">
            Найдено: {totalDocs}
          </p>
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
        <nav aria-label="Страницы каталога" className="mt-12 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`rounded-lg px-4 py-2 text-sm ${
                n === page ? 'bg-accent text-accent-foreground' : 'bg-surface text-foreground'
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </main>
  )
}
