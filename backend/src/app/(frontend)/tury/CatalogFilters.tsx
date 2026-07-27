'use client'

import { Button, Label, ListBox, NumberField, Select } from '@heroui/react'
import Link from 'next/link'
import type { CatalogParams } from '@/lib/catalog'

type Country = { id: number; name: string; slug: string }

const TYPES = [
  { id: 'concert', label: 'Концерт' },
  { id: 'sport', label: 'Спорт' },
  { id: 'racing', label: 'Гонки' },
]

const SORTS = [
  { id: '-date', label: 'Сначала ближайшие' },
  { id: 'date', label: 'Сначала дальние' },
  { id: 'price', label: 'Сначала дешёвые' },
  { id: '-price', label: 'Сначала дорогие' },
]

/**
 * Обычная GET-форма: submit меняет searchParams и перерисовывает страницу на
 * сервере. Своего JS для фильтрации нет — HeroUI отдаёт значения через
 * скрытые нативные поля, поэтому форма работает и до гидрации.
 */
export function CatalogFilters({
  countries,
  active,
  hasActiveFilters,
}: {
  countries: Country[]
  active: CatalogParams
  hasActiveFilters: boolean
}) {
  return (
    <form
      method="GET"
      action="/tury"
      aria-label="Фильтры каталога"
      className="border-ink-line bg-ink-raised/60 flex flex-wrap items-end gap-4 rounded-2xl border p-4 backdrop-blur"
    >
      <Select
        name="country"
        defaultSelectedKey={active.country}
        placeholder="Любая"
        className="min-w-[190px] flex-1"
      >
        <Label>Страна</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {countries.map((c) => (
              <ListBox.Item key={c.slug} id={c.slug} textValue={c.name}>
                {c.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        name="type"
        defaultSelectedKey={active.type}
        placeholder="Любой"
        className="min-w-[170px] flex-1"
      >
        <Label>Тип события</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {TYPES.map((t) => (
              <ListBox.Item key={t.id} id={t.id} textValue={t.label}>
                {t.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <NumberField
        name="maxPrice"
        defaultValue={active.maxPrice ? Number(active.maxPrice) : undefined}
        minValue={0}
        step={1000}
        formatOptions={{ style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }}
        className="min-w-[170px] flex-1"
      >
        <Label>Цена до</Label>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input placeholder="Любая" />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>

      <Select name="sort" defaultSelectedKey={active.sort ?? '-date'} className="min-w-[200px] flex-1">
        <Label>Сортировка</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {SORTS.map((s) => (
              <ListBox.Item key={s.id} id={s.id} textValue={s.label}>
                {s.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          Показать
        </Button>
        {hasActiveFilters && (
          // Сброс — навигация, а не действие: обычная ссылка, чтобы работал
          // Ctrl+клик и переход попадал в историю.
          <Link
            href="/tury"
            className="text-muted hover:text-foreground focus-visible:ring-accent inline-flex items-center rounded-lg px-4 py-2 text-sm underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Сбросить
          </Link>
        )}
      </div>
    </form>
  )
}
