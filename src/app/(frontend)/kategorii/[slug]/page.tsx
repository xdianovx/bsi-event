import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Typography } from '@heroui/react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { CategoryIcon, categoryUrl, collectPopulatedCategories, getCategory } from '@/entities/category'
import { EventCard } from '@/entities/event'
import { Breadcrumbs, Page, Section } from '@/shared/ui'

type Params = Promise<{ slug: string }>

const load = async (slug: string) => {
  const payload = await getPayload({ config: await config })
  const category = await getCategory(payload, slug)
  if (!category) return null

  const [populated, { docs: events }] = await Promise.all([
    collectPopulatedCategories(payload),
    payload.find({
      collection: 'events',
      where: { status: { equals: 'published' }, 'category.slug': { equals: slug } },
      sort: '-startDate',
      limit: 24,
      depth: 2,
    }),
  ])

  // Категория без опубликованных событий — пустая страница, её быть не должно
  if (!populated.ids.has(category.id)) return null

  return { category, events }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const data = await load(slug)

  if (!data) return { title: 'Категория не найдена' }

  const { category } = data

  return {
    title: category.seo?.title || `${category.name} — поездки на события`,
    description:
      category.seo?.description ||
      `${category.name}: поездка на событие целиком — билет, проживание и виза одним заказом.`,
    alternates: { canonical: categoryUrl.item(category.slug) },
    robots: category.seo?.noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params
  const data = await load(slug)

  if (!data) notFound()

  const { category, events } = data

  return (
    <Page>
      <Section>
        <Breadcrumbs
          items={[{ label: 'Категории', href: categoryUrl.hub() }, { label: category.name }]}
        />
        <div className="flex items-center gap-3">
          <CategoryIcon icon={category.icon} />
          <Typography.Heading level={1}>{category.name}</Typography.Heading>
        </div>
      </Section>

      {category.description && (
        <Section>
          <div className="prose max-w-none">
            <RichText data={category.description} />
          </div>
        </Section>
      )}

      <Section>
        <Typography.Heading level={2}>События</Typography.Heading>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  )
}
