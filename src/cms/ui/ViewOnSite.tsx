'use client'

import { Button, useFormFields } from '@payloadcms/ui'

/**
 * Кнопка на живую страницу события.
 *
 * Черновик наружу не отдаётся (страница вернёт 404), поэтому для него показываем
 * подсказку вместо кнопки — иначе менеджер уходит по ссылке в «не найдено»
 * и думает, что сломался сайт.
 */
export const ViewOnSite = () => {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)

  if (!slug) return null

  if (status !== 'published') {
    return (
      <p className="field-description">Страница откроется после публикации: /sobytiya/{slug}</p>
    )
  }

  return (
    <Button el="anchor" url={`/sobytiya/${slug}`} newTab buttonStyle="secondary" size="medium">
      Посмотреть на сайте
    </Button>
  )
}
