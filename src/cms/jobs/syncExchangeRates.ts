import type { Payload, PayloadRequest, TaskConfig } from 'payload'
import { fetchCbrRates, type CbrResponse } from '../lib/cbr'

export type SyncResult =
  | { status: 'ok'; date: string; count: number }
  | { status: 'skipped'; reason: string }

type Args = {
  payload: Payload
  req?: PayloadRequest
  /** Подменяется в тестах; в проде всегда ходим в ЦБ. */
  fetchRates?: () => Promise<CbrResponse>
}

/**
 * Забирает курс у ЦБ и кладёт в историю.
 *
 * Запись за дату обновляется, а не дублируется: повторный запуск в тот же день — обычное
 * дело (ретрай задачи, ручной вызов), и каждый не должен плодить строку.
 *
 * Ошибку не проглатываем, но перед пробросом записываем в настройки: цены при недоступном
 * источнике продолжают считаться по последнему известному курсу, и без отметки в админке
 * этого было бы не видно.
 */
export const syncExchangeRates = async ({
  payload,
  req,
  fetchRates = fetchCbrRates,
}: Args): Promise<SyncResult> => {
  const settings = await payload.findGlobal({ slug: 'settings', req })

  if (settings.ratesAutoUpdate === false) {
    return { status: 'skipped', reason: 'Автообновление курса выключено в настройках' }
  }

  try {
    const { date, rates } = await fetchRates()

    for (const { currency, rate } of rates) {
      const { docs } = await payload.find({
        collection: 'exchangeRates',
        where: { and: [{ date: { equals: date } }, { currency: { equals: currency } }] },
        limit: 1,
        depth: 0,
        req,
      })

      if (docs[0]) {
        await payload.update({
          collection: 'exchangeRates',
          id: docs[0].id,
          data: { rate, source: 'cbr' },
          req,
        })
      } else {
        await payload.create({
          collection: 'exchangeRates',
          data: { date, currency, rate, source: 'cbr' },
          req,
        })
      }
    }

    await payload.updateGlobal({
      slug: 'settings',
      data: { lastSyncAt: new Date().toISOString(), lastSyncStatus: 'Успешно' },
      req,
    })

    return { status: 'ok', date, count: rates.length }
  } catch (error) {
    await payload.updateGlobal({
      slug: 'settings',
      data: {
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: `Ошибка: ${(error as Error).message}`,
      },
      req,
    })

    throw error
  }
}

/**
 * `schedule` кладёт задачу в очередь, исполняет её либо внутренний `autoRun`, либо внешний
 * вызов `GET /api/payload-jobs/run?queue=rates` — см. `jobs` в payload.config.
 * Одного из двух недостаточно: без расписания очередь пуста, без раннера никто её не разберёт.
 */
export const syncExchangeRatesTask: TaskConfig<'syncExchangeRates'> = {
  slug: 'syncExchangeRates',
  label: 'Синхронизация курса ЦБ',
  schedule: [{ cron: '0 9 * * *', queue: 'rates' }],
  handler: async ({ req }) => {
    const output = await syncExchangeRates({ payload: req.payload, req })

    return { output }
  },
}
