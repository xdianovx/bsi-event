import { Button, Card } from '@heroui/react'

/** Сквозной блок заявки. Ставится в конце страницы и на пустых состояниях. */
export function LeadCta() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Не нашли нужное событие?</Card.Title>
        <Card.Description>
          Назовите концерт, матч или гонку — проверим билеты и соберём поездку под вас.
          Заявка ни к чему не обязывает, оплаты на сайте нет.
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button size="lg">Оставить заявку</Button>
      </Card.Footer>
    </Card>
  )
}
