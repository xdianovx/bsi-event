import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPayload, Payload } from 'payload'
import config from '@/cms/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

const seedRows: { slug: string; name: string; scope: string[]; order: number }[] = JSON.parse(
  readFileSync(join(process.cwd(), 'src/cms/seed/data/components.json'), 'utf8'),
)

/** Прогон настоящего сида: проверять идемпотентность имитацией бессмысленно. */
const runSeed = () =>
  execFileSync('npx', ['tsx', 'src/cms/seed.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
    stdio: 'pipe',
  })

const findAll = () =>
  payload.find({
    collection: 'components',
    where: { slug: { in: seedRows.map((row) => row.slug) } },
    limit: 0,
    depth: 0,
    sort: 'order',
  })

describe('Сид составляющих тура', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    runSeed()
  }, 180_000)

  it('заливает девять записей', async () => {
    const { docs } = await findAll()

    expect(seedRows).toHaveLength(9)
    expect(docs).toHaveLength(9)
    expect(docs.map((doc) => doc.slug)).toEqual(seedRows.map((row) => row.slug))
  })

  it('проставляет order и множественный scope', async () => {
    const { docs } = await findAll()
    const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))

    expect(docs.map((doc) => doc.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    // Отель и питание осмысленны и как состав тура, и как удобство номера
    expect(bySlug.get('otel')?.scope).toEqual(['tour', 'room'])
    expect(bySlug.get('pitanie')?.scope).toEqual(['tour', 'room'])
    expect(bySlug.get('bilety')?.scope).toEqual(['tour'])
  })

  it('повторный запуск не плодит дубли и не затирает правки', async () => {
    const edited = await payload.update({
      collection: 'components',
      where: { slug: { equals: 'gid' } },
      data: { description: 'Правка контент-менеджера' },
    })
    expect(edited.docs).toHaveLength(1)

    runSeed()

    const { docs } = await findAll()
    expect(docs).toHaveLength(9)
    expect(docs.find((doc) => doc.slug === 'gid')?.description).toBe('Правка контент-менеджера')
  }, 180_000)
})
