import type { Metadata } from 'next'
import { Card, Chip, Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { AttributeIcon, getAttributes } from '@/entities/attribute'
import { Page, Section } from '@/shared/ui'

// Витрина служебная: заказчик и редакция проверяют глазами иконки и тексты.
// Трафика она не ищет — закрыта от индексации и не попадает в sitemap.xml.
export const metadata: Metadata = {
  title: 'Атрибуты — справочник',
  robots: { index: false, follow: false },
}

const SCOPE_LABELS: Record<string, string> = {
  tour: 'Тур',
  room: 'Номер',
}

export default async function AttributesShowcasePage() {
  const payload = await getPayload({ config: await config })
  const attributes = await getAttributes(payload)

  return (
    <Page>
      <Section>
        <Typography.Heading level={1}>Атрибуты</Typography.Heading>
        <Typography color="muted">
          Справочник того, из чего складывается тур и что есть в номере. Заполняется в админке,
          отсюда попадает в карточки и на страницы туров.
        </Typography>
      </Section>

      {attributes.length === 0 ? (
        <Typography color="muted">
          Справочник пуст. Заведите атрибуты в админке или выполните команду сида.
        </Typography>
      ) : (
        <Section>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attributes.map((attribute) => (
              <li key={attribute.id}>
                <Card className="h-full">
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      {/* Иконки может не быть — тогда остаётся название: без него
                          непонятно, что входит в тур, без картинки — понятно. */}
                      <AttributeIcon icon={attribute.icon} />
                      <Card.Title>{attribute.name}</Card.Title>
                    </div>
                    {attribute.description && (
                      <Card.Description>{attribute.description}</Card.Description>
                    )}
                  </Card.Header>

                  <Card.Footer className="mt-auto gap-2">
                    {attribute.scope.map((scope) => (
                      <Chip key={scope} size="sm">
                        {SCOPE_LABELS[scope] ?? scope}
                      </Chip>
                    ))}
                  </Card.Footer>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Page>
  )
}
