import { Card, Chip } from '@heroui/react'

/**
 * Четыре шага. Здесь нумерация оправдана: это последовательность, и порядок
 * несёт смысл — человек хочет понимать, когда с него попросят деньги.
 */
const STEPS = [
  { title: 'Оставляете заявку', text: 'Имя и телефон. Ничего не оплачиваете.' },
  { title: 'Менеджер перезванивает', text: 'Проверяет наличие билетов и мест, считает точную стоимость.' },
  { title: 'Оформляем поездку', text: 'Билет, перелёт, отель, страховка и виза — документы готовим мы.' },
  { title: 'Вы едете', text: 'Остаёмся на связи всю поездку, включая непредвиденное на месте.' },
]

export function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, i) => (
        <li key={step.title}>
          <Card className="h-full">
            <Card.Header>
              <Chip className="self-start" size="sm">
                Шаг {i + 1}
              </Chip>
              <Card.Title>{step.title}</Card.Title>
              <Card.Description>{step.text}</Card.Description>
            </Card.Header>
          </Card>
        </li>
      ))}
    </ol>
  )
}
