import type { Component } from '@/payload-types'

/**
 * Иконка составляющей. Файл подключается как CSS-маска, а цвет берётся из
 * currentColor — так иконка следует теме и состоянию. Через <img> этого не
 * добиться (CSS внутрь картинки не проникает), а встраивать загруженный SVG
 * в разметку нельзя: он может содержать скрипт.
 *
 * Плата за это — иконка обязана быть одноцветной: маска использует форму,
 * а не цвета файла.
 *
 * Иконки нет — не рисуем ничего: название важнее картинки, заглушка только
 * шумит.
 */
export function ComponentIcon({ icon }: { icon: Component['icon'] }) {
  const url = typeof icon === 'object' && icon?.url ? icon.url : null

  if (!url) return null

  return (
    <span
      aria-hidden
      className="bg-current inline-block h-6 w-6 shrink-0"
      style={{
        maskImage: `url(${url})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
      }}
    />
  )
}
