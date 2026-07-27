import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

export const metadata: Metadata = {
  title: 'Направления — страны событийных туров | BSI Events',
  description:
    'Страны, куда мы организуем туры на концерты, спортивные матчи и гонки: билеты, проживание и виза под ключ.',
}

export default async function NapravleniyaPage() {
  const payload = await getPayload({ config: await config })
  const { docs: countries } = await payload.find({
    collection: 'countries',
    sort: 'name',
    limit: 100,
  })

  return (
    <main>
      <h1>Направления</h1>
      {countries.length === 0 ? (
        <p>Направления скоро появятся.</p>
      ) : (
        <ul>
          {countries.map((country) => (
            <li key={country.id}>
              <Link href={`/napravleniya/${country.slug}/`}>{country.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
