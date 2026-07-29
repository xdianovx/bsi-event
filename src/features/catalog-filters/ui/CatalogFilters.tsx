'use client'

import { Button, Checkbox, CheckboxGroup, Label, ListBox, NumberField, Select } from '@heroui/react'
import Link from 'next/link'
import type { CatalogParams } from '@/entities/event'

type GeoOption = { name: string; slug: string }

const SORTS = [
  { id: '-date', label: 'Сначала ближайшие' },
  { id: 'date', label: 'Сначала дальние' },
  { id: 'price', label: 'Сначала дешёвые' },
  { id: '-price', label: 'Сначала дорогие' },
]

/** Один и тот же селект для всех гео-уровней — отличается только подписью. */
function GeoSelect({
  name,
  label,
  placeholder,
  options,
  value,
}: {
  name: string
  label: string
  placeholder: string
  options: GeoOption[]
  value?: string
}) {
  return (
    <Select
      name={name}
      defaultSelectedKey={value}
      placeholder={placeholder}
      className="min-w-[170px] flex-1"
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={o.slug} id={o.slug} textValue={o.name}>
              {o.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

/**
 * Обычная GET-форма: submit меняет searchParams и перерисовывает страницу на
 * сервере. Своего JS для фильтрации нет — HeroUI отдаёт значения через
 * скрытые нативные поля, поэтому форма работает и до гидрации.
 *
 * Гео-списки зависимые: сужение считается на сервере при отправке.
 */
export function CatalogFilters({
  regions,
  countries,
  cities,
  categories,
  active,
  hasActiveFilters,
}: {
  regions: GeoOption[]
  countries: GeoOption[]
  cities: GeoOption[]
  categories: { name: string; slug: string }[]
  active: CatalogParams
  hasActiveFilters: boolean
}) {
  return (
    <form
      method="GET"
      action="/sobytiya"
      aria-label="Фильтры каталога"
      className="bg-surface flex flex-wrap items-end gap-4 rounded-2xl p-4"
    >
      <GeoSelect
        name="region"
        label="Регион"
        placeholder="Любой"
        options={regions}
        value={active.region}
      />

      <GeoSelect
        name="country"
        label="Страна"
        placeholder="Любая"
        options={countries}
        value={active.country}
      />

      <GeoSelect
        name="city"
        label="Город"
        placeholder="Любой"
        options={cities}
        value={active.city}
      />

      {/* Чекбоксы, а не select: категорий можно выбрать несколько, и каждая
          отмеченная уходит отдельным `category=` в query — это делает сам
          браузер, своего JS не нужно. */}
      <CheckboxGroup name="category" defaultValue={active.category} className="min-w-[220px] flex-1">
        <Label>Категории</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((c) => (
            <Checkbox key={c.slug} value={c.slug}>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>{c.name}</Checkbox.Content>
            </Checkbox>
          ))}
        </div>
      </CheckboxGroup>

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

      <Select name="sort" defaultSelectedKey={active.sort ?? '-date'} className="w-[220px]">
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
            href="/sobytiya"
            className="text-muted hover:text-foreground focus-visible:ring-accent inline-flex items-center rounded-lg px-4 py-2 text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            Сбросить
          </Link>
        )}
      </div>
    </form>
  )
}
