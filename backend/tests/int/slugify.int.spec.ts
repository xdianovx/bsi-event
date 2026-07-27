import { describe, it, expect } from 'vitest'
import { slugify } from '@/lib/slugify'

describe('slugify', () => {
  it('транслитерирует русское название страны в слаг', () => {
    expect(slugify('Германия')).toBe('germaniya')
  })
})
