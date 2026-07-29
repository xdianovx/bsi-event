import { Card } from '@heroui/react'

/**
 * Четыре причины не собирать поездку самому. Стоит сразу под первым экраном:
 * по исследованию главная привычка, которую надо перебить, — покупать билет
 * самостоятельно на Afisha, поэтому выгода пакета должна читаться до каталога.
 */
const ITEMS = [
  { title: 'Визу оформляем мы', text: 'Готовим документы и подаём за вас. Это главная причина, по которой поездку не собирают сами.' },
  { title: 'Всё одним заказом', text: 'Билет на событие, перелёт, отель и страховка. Не нужно сводить пять бронирований.' },
  { title: 'Оплаты на сайте нет', text: 'Сначала менеджер подтвердит наличие и посчитает точную стоимость.' },
  { title: 'Ведём до возвращения', text: 'На связи от заявки до вылета обратно, включая форс-мажоры на месте.' },
]

export function TrustBar() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <li key={item.title}>
          <Card className="h-full">
            <Card.Header>
              <Card.Title>{item.title}</Card.Title>
              <Card.Description>{item.text}</Card.Description>
            </Card.Header>
          </Card>
        </li>
      ))}
    </ul>
  )
}
