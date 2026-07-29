import type { Media } from '@/payload-types'

/**
 * Флаг страны. По умолчанию берётся статикой по коду ISO — 243 флага в
 * медиатеке сделали бы её нечитаемой, а файлы эти не меняются. Загруженный
 * файл, если он есть, побеждает: это ручное переопределение.
 *
 * Отдаём через <img>, а не инлайном: загруженный SVG может содержать скрипт,
 * и при встраивании в разметку он выполнился бы в браузере посетителя от
 * имени сайта.
 */
export function Flag({
  flag,
  code,
  name,
}: {
  flag?: Media | number | null
  code?: string | null
  name: string
}) {
  const uploaded = typeof flag === 'object' && flag?.url ? flag.url : null
  const src = uploaded ?? (code ? `/flags/4x3/${code}.svg` : null)

  if (!src) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element -- media отдаётся Payload, next/image потребует настройки loader
    <img src={src} alt={`Флаг: ${name}`} className="h-4 w-6 shrink-0 object-cover" loading="lazy" />
  )
}
