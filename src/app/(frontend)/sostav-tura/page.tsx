import type { Metadata } from 'next'
import { Card, Chip, Typography } from '@heroui/react'
import { getPayload } from 'payload'

import config from '@/cms/payload.config'
import { ComponentIcon, getComponents } from '@/entities/component'
import { Page, Section } from '@/shared/ui'

// Витрина служебная: заказчик и редакция проверяют глазами иконки и тексты.
// Трафика она не ищет — закрыта от индексации и не попадает в sitemap.xml.
export const metadata: Metadata = {
  title: 'Составляющие тура — справочник',
  robots: { index: false, follow: false },
}

const SCOPE_LABELS: Record<string, string> = {
  tour: 'Тур',
  room: 'Номер',
}

export default async function ComponentsShowcasePage() {
  const payload = await getPayload({ config: await config })
  const components = await getComponents(payload)

  return (
    <Page>
      <Section>
        <Typography.Heading level={1}>Составляющие тура</Typography.Heading>
        <Typography color="muted">
          Справочник того, из чего складывается тур. Заполняется в админке, отсюда попадает в
          карточки и на страницы туров.
        </Typography>
      </Section>

      {components.length === 0 ? (
        <Typography color="muted">
          Справочник пуст. Заведите составляющие в админке или выполните команду сида.
        </Typography>
      ) : (
        <Section>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {components.map((component) => (
              <li key={component.id}>
                <Card className="h-full">
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      {/* Иконки может не быть — тогда остаётся название: без него
                          непонятно, что входит в тур, без картинки — понятно. */}
                      <ComponentIcon icon={component.icon} />
                      <Card.Title>{component.name}</Card.Title>
                    </div>
                    {component.description && (
                      <Card.Description>{component.description}</Card.Description>
                    )}
                  </Card.Header>

                  <Card.Footer className="mt-auto gap-2">
                    {component.scope.map((scope) => (
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
