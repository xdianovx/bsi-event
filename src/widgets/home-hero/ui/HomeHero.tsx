import Link from 'next/link'
import { Button, Typography } from '@heroui/react'
import { CatalogFilters } from '@/features/catalog-filters'
import { Section } from '@/shared/ui'

type Option = { name: string; slug: string }

/**
 * Первый экран. Оффер сформулирован от отличия, а не от цены: прямых
 * конкурентов в нише мало, и позиционирование строим на «под ключ + виза»,
 * а не на «дешевле всех» (см. разбор конкурентов).
 *
 * Фильтр — тот же, что в каталоге: он и так отправляет GET на /tury, поэтому
 * второй его копии для главной не нужно.
 */
export function HomeHero({
  regions,
  countries,
  cities,
}: {
  regions: Option[]
  countries: Option[]
  cities: Option[]
}) {
  return (
    <Section className="gap-6">
      <Typography className="text-accent tracking-[0.2em] uppercase" type="body-xs">
        Билет · перелёт · отель · виза
      </Typography>

      <Typography.Heading className="max-w-3xl text-balance" level={1}>
        Поездка на событие целиком, вместе с визой
      </Typography.Heading>

      <Typography className="max-w-2xl" color="muted">
        Концерты, матчи и гонки за рубежом. Собираем всё одним заказом и оформляем визу —
        вам остаётся приехать в аэропорт.
      </Typography>

      <div className="flex flex-wrap gap-3">
        <Button size="lg">Подобрать поездку</Button>
        <Link href="/tury" className="link self-center">
          Смотреть все туры
        </Link>
      </div>

      <CatalogFilters
        regions={regions}
        countries={countries}
        cities={cities}
        active={{}}
        hasActiveFilters={false}
      />
    </Section>
  )
}
