import type { Payload } from 'payload'
import type { Attribute } from '@/payload-types'

/** Где применяется атрибут: состав тура или удобство номера. */
export type AttributeScope = Attribute['scope'][number]

/**
 * Справочник целиком: записей десяток, сортировка задана коллекцией.
 * `depth: 1` — раскрываем иконку, ради её url и делается запрос.
 */
export const getAttributes = async (
  payload: Payload,
  scope?: AttributeScope,
): Promise<Attribute[]> => {
  const { docs } = await payload.find({
    collection: 'attributes',
    where: scope ? { scope: { contains: scope } } : {},
    limit: 0,
    depth: 1,
  })

  return docs
}
