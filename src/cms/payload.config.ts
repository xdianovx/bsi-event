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
import { Countries } from './collections/Countries'
import { Regions } from './collections/Regions'
import { Cities } from './collections/Cities'
import { Events } from './collections/Events'
import { Leads } from './collections/Leads'
import { Reviews } from './collections/Reviews'
import { Pages } from './collections/Pages'
import { Settings } from './globals/Settings'

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
  collections: [
    Users,
    Media,
    Icons,
    Regions,
    Countries,
    Cities,
    Attributes,
    Events,
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
