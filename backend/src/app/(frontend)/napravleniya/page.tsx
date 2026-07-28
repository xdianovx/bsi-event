import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { geoUrl } from '@/lib/geo'
import { Breadcrumbs, GeoTile, GeoTiles } from './GeoUI'

export const metadata: Metadata = {
  title: 'Направления',
  description:
    'Регионы и страны, куда мы организуем туры на концерты, спортивные матчи и гонки: билет, проживание и виза под ключ.',
  alternates: { canonical: '/napravleniya' },
}

export default async function RegionsPage() {
  const payload = await getPayload({ config: await config })

  const [{ docs: regions }, { docs: orphanCountries }] = await Promise.all([
    payload.find({ collection: 'regions', sort: 'name', limit: 100, depth: 0 }),
    // Страны без региона иначе выпали бы из навигации совсем
    payload.find({
      collection: 'countries',
      where: { region: { exists: false } },
      sort: 'name',
      limit: 100,
      depth: 1,
    }),
  ])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <Breadcrumbs items={[{ label: 'Направления' }]} />

      <h1 className="mb-4 text-3xl leading-tight font-extrabold sm:text-5xl">Направления</h1>
      <p className="text-muted mb-10 max-w-2xl text-lg">
        Выберите регион — внутри страны, города и туры на события.
      </p>

      {regions.length === 0 && orphanCountries.length === 0 ? (
        <p className="text-muted">Направления скоро появятся.</p>
      ) : (
        <>
          {regions.length > 0 && (
            <GeoTiles>
              {regions.map((region) => (
                <GeoTile key={region.id} href={geoUrl.region(region.slug)} name={region.name} />
              ))}
            </GeoTiles>
          )}

          {orphanCountries.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold">Другие страны</h2>
              <GeoTiles>
                {orphanCountries.map((country) => (
                  <GeoTile
                    key={country.id}
                    href={`/tury?country=${country.slug}`}
                    name={country.name}
                    flag={country.flag}
                  />
                ))}
              </GeoTiles>
            </section>
          )}
        </>
      )}
    </main>
  )
}
