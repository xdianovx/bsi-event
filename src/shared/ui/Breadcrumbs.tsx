import { Breadcrumbs as HeroBreadcrumbs } from '@heroui/react'

export type Crumb = { label: string; href?: string }

/**
 * Хлебные крошки — компонент HeroUI как есть.
 *
 * Ссылки обычные (<a href>), а не next/link: подменить элемент можно только
 * через render-проп, а это функция, и передать её из серверного компонента
 * нельзя. Переход по крошке перезагружает страницу целиком — на SSR-страницах
 * с почти статичным содержимым разница незаметна, зато ссылки настоящие и
 * поисковик по ним ходит.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <HeroBreadcrumbs aria-label="Хлебные крошки">
      {items.map((item) => (
        <HeroBreadcrumbs.Item key={item.label} href={item.href}>
          {item.label}
        </HeroBreadcrumbs.Item>
      ))}
    </HeroBreadcrumbs>
  )
}
