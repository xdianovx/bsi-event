import type { Category } from '@/payload-types'

/**
 * Иконка категории — та же техника, что у атрибутов: файл подключается как
 * CSS-маска, цвет берётся из currentColor. Инлайнить загруженный SVG нельзя
 * (в нём может быть скрипт), а внутрь <img> стили не проникают.
 *
 * Иконки нет — не рисуем ничего: название важнее картинки.
 */
export function CategoryIcon({ icon }: { icon: Category['icon'] }) {
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
