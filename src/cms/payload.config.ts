import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { openapi, swaggerUI } from 'payload-oapi'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Icons } from './collections/Icons'
import { Attributes } from './collections/Attributes'
import { Categories } from './collections/Categories'
import { Countries } from './collections/Countries'
import { Regions } from './collections/Regions'
import { Cities } from './collections/Cities'
import { Events } from './collections/Events'
import { ExchangeRates } from './collections/ExchangeRates'
import { Leads } from './collections/Leads'
import { Reviews } from './collections/Reviews'
import { Pages } from './collections/Pages'
import { Settings } from './globals/Settings'
import { syncExchangeRatesTask } from './jobs/syncExchangeRates'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    dateFormat: 'dd.MM.yyyy',
    components: {
      // Витрина заявок над стандартным содержимым главной админки.
      // Путь считается от importMap.baseDir, то есть от src/.
      beforeDashboard: ['/cms/ui/LeadStats#default'],
    },
    importMap: {
      // baseDir — src/, а не src/cms/: от него считаются пути компонентов выше
      baseDir: path.resolve(dirname, '..'),
    },
  },
  i18n: {
    supportedLanguages: { ru, en },
    fallbackLanguage: 'ru',
  },
  jobs: {
    access: {
      // Внешний планировщик ходит без сессии, поэтому пускаем по секрету из окружения.
      // Нет секрета — эндпоинт закрыт для всех, кроме залогиненных.
      run: ({ req }) => {
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        return req.headers.get('authorization') === `Bearer ${secret}`
      },
    },
    tasks: [syncExchangeRatesTask],
    // Внутренний планировщик — только там, где процесс живёт постоянно: на serverless он
    // не работает, а при нескольких инстансах задача выполнилась бы столько же раз.
    // Иначе очередь разбирает внешний вызов GET /api/payload-jobs/run?queue=rates.
    autoRun:
      process.env.RATES_AUTORUN === 'true'
        ? [{ cron: '*/10 * * * *', queue: 'rates', limit: 5 }]
        : [],
  },
  collections: [
    Users,
    Media,
    Icons,
    Regions,
    Countries,
    Cities,
    Attributes,
    Categories,
    Events,
    ExchangeRates,
    Leads,
    Reviews,
    Pages,
  ],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, '..', 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    openapi({
      openapiVersion: '3.0',
      metadata: { title: 'BSI Events API', version: '0.1.0' },
    }),
    swaggerUI({}),
  ],
})
