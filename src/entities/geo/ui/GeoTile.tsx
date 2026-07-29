import NextLink from 'next/link'
import { Card, Chip } from '@heroui/react'
import type { Media } from '@/payload-types'
import { Flag } from './Flag'

/** Плитка уровня географии — регион, страна или город. */
export function GeoTile({
  href,
  name,
  note,
  flag,
  code,
}: {
  href: string
  name: string
  note?: string
  flag?: Media | number | null
  code?: string | null
}) {
  return (
    <li>
      {/* Радиус и отступы — от Card, снаружи задаём только поведение ссылки */}
      <NextLink href={href} className="block">
        <Card>
          <Card.Header className="flex-row items-center gap-3">
            <Flag flag={flag} code={code} name={name} />
            <Card.Title>{name}</Card.Title>
            {note && (
              <Chip className="ml-auto" size="sm">
                {note}
              </Chip>
            )}
          </Card.Header>
        </Card>
      </NextLink>
    </li>
  )
}

export function GeoTiles({ children }: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
}
