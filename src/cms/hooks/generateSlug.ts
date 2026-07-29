import type { FieldHook } from 'payload'
import { slugify } from '@/shared/lib'

export const generateSlug = (sourceField: string): FieldHook => {
  return ({ value, data }) => {
    if (value) return value
    const source = data?.[sourceField]
    if (typeof source === 'string' && source.trim()) {
      return slugify(source)
    }
    return value
  }
}
