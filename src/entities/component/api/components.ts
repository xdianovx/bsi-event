import type { Payload } from 'payload'
import type { Component } from '@/payload-types'

/** Где применяется составляющая: состав тура или удобство номера. */
export type ComponentScope = Component['scope'][number]

/**
 * Справочник целиком: записей десяток, сортировка задана коллекцией.
 * `depth: 1` — раскрываем иконку, ради её url и делается запрос.
 */
export const getComponents = async (
  payload: Payload,
  scope?: ComponentScope,
): Promise<Component[]> => {
  const { docs } = await payload.find({
    collection: 'components',
    where: scope ? { scope: { contains: scope } } : {},
    limit: 0,
    depth: 1,
  })

  return docs
}
