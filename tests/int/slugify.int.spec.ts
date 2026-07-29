import { describe, it, expect } from 'vitest'
import { slugify } from '@/shared/lib'

describe('slugify', () => {
  it('транслитерирует русское название страны в слаг', () => {
    expect(slugify('Германия')).toBe('germaniya')
  })

  it('заменяет пробелы и пунктуацию на дефисы, схлопывает повторы, обрезает края', () => {
    expect(slugify('Тур с тарифами!')).toBe('tur-s-tarifami')
    expect(slugify('  Билет + отель  ')).toBe('bilet-otel')
  })
})
