import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { CategoryIcon, categoryUrl, collectPopulatedCategories, getCategories } from '@/entities/category'
import { Breadcrumbs, Page, Section } from '@/shared/ui'

export const metadata: Metadata = {
  title: 'Категории событий',
  description:
    'Концерты, спортивные матчи и гонки: поездка на событие целиком — билет, проживание и виза одним заказом.',
  alternates: { canonical: '/kategorii' },
}

const plural = (n: number, forms: [string, string, string]) => {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return forms[2]
  const mod10 = n % 10
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

export default async function CategoriesHubPage() {
  const payload = await getPayload({ config: await config })

  const [categories, populated] = await Promise.all([
    getCategories(payload),
    collectPopulatedCategories(payload),
  ])

  // Пустые категории не показываем: их страницы отдают 404, ссылаться некуда
  const visible = categories.filter((category) => populated.ids.has(category.id))

  return (
    <Page>
      <Section>
        <Breadcrumbs items={[{ label: 'Категории' }]} />
        <Typography.Heading level={1}>Категории событий</Typography.Heading>
      </Section>

      {visible.length === 0 ? (
        <Typography color="muted">
          Пока нет опубликованных событий ни в одной категории.
        </Typography>
      ) : (
        <Section>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((category) => {
              const count = populated.counts.get(category.id) ?? 0

              return (
                <li key={category.id}>
                  <Card className="h-full">
                    <Card.Header>
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={category.icon} />
                        <Card.Title>
                          {/* Ссылка растянута на карточку: кликабельна вся плитка */}
                          <Link
                            href={categoryUrl.item(category.slug)}
                            className="after:absolute after:inset-0"
                          >
                            {category.name}
                          </Link>
                        </Card.Title>
                      </div>
                      <Card.Description>
                        {count} {plural(count, ['событие', 'события', 'событий'])}
                      </Card.Description>
                    </Card.Header>
                  </Card>
                </li>
              )
            })}
          </ul>
        </Section>
      )}
    </Page>
  )
}
