import { describe, it, expect } from 'vitest'
import { buildCatalogQuery } from '@/entities/event'

describe('buildCatalogQuery', () => {
  it('без параметров отдаёт только опубликованные, сортировка по дате от новых', () => {
    const q = buildCatalogQuery({})

    expect(q.where).toEqual({ status: { equals: 'published' } })
    expect(q.sort).toBe('-startDate')
  })

  it('фильтрует страну по слагу — фасетные URL приходят слагом, не id', () => {
    const q = buildCatalogQuery({ country: 'italia' })

    expect(q.where).toMatchObject({ 'country.slug': { equals: 'italia' } })
  })

  it('фильтрует по региону через цепочку страна→регион', () => {
    const q = buildCatalogQuery({ region: 'evropa' })

    expect(q.where).toMatchObject({ 'country.region.slug': { equals: 'evropa' } })
  })

  it('фильтрует по городу', () => {
    const q = buildCatalogQuery({ city: 'milan' })

    expect(q.where).toMatchObject({ 'city.slug': { equals: 'milan' } })
  })

  it('уровни гео комбинируются', () => {
    const q = buildCatalogQuery({ region: 'evropa', country: 'italia', city: 'milan' })

    expect(q.where).toEqual({
      status: { equals: 'published' },
      'country.region.slug': { equals: 'evropa' },
      'country.slug': { equals: 'italia' },
      'city.slug': { equals: 'milan' },
    })
  })

  it('фильтрует по типу события', () => {
    const q = buildCatalogQuery({ type: 'concert' })

    expect(q.where).toMatchObject({ type: { equals: 'concert' } })
  })

  it('фильтрует по цене через priceRub — сравнение валют должно быть честным', () => {
    const q = buildCatalogQuery({ minPrice: '5000', maxPrice: '20000' })

    expect(q.where).toMatchObject({
      priceRub: { greater_than_equal: 5000, less_than_equal: 20000 },
    })
  })

  it('фильтрует по диапазону дат', () => {
    const q = buildCatalogQuery({ dateFrom: '2026-08-01', dateTo: '2026-09-01' })

    expect(q.where).toMatchObject({
      startDate: { greater_than_equal: '2026-08-01', less_than_equal: '2026-09-01' },
    })
  })

  it('сортирует по цене в обе стороны', () => {
    expect(buildCatalogQuery({ sort: 'price' }).sort).toBe('priceRub')
    expect(buildCatalogQuery({ sort: '-price' }).sort).toBe('-priceRub')
  })

  it('сортирует по дате в обе стороны', () => {
    expect(buildCatalogQuery({ sort: 'date' }).sort).toBe('startDate')
    expect(buildCatalogQuery({ sort: '-date' }).sort).toBe('-startDate')
  })

  it('неизвестную сортировку заменяет дефолтной, а не падает', () => {
    expect(buildCatalogQuery({ sort: 'ерунда' }).sort).toBe('-startDate')
  })

  it('мусорные цены отбрасывает: параметры приходят из URL', () => {
    const q = buildCatalogQuery({ minPrice: 'abc', maxPrice: '' })

    expect(q.where).toEqual({ status: { equals: 'published' } })
  })

  it('комбинирует фильтры', () => {
    const q = buildCatalogQuery({ country: 'italia', type: 'sport', maxPrice: '20000' })

    expect(q.where).toEqual({
      status: { equals: 'published' },
      'country.slug': { equals: 'italia' },
      type: { equals: 'sport' },
      priceRub: { less_than_equal: 20000 },
    })
  })

  it('пагинация: дефолт первая страница, номер страницы читается из строки', () => {
    expect(buildCatalogQuery({}).page).toBe(1)
    expect(buildCatalogQuery({ page: '3' }).page).toBe(3)
    expect(buildCatalogQuery({ page: 'abc' }).page).toBe(1)
  })
})
