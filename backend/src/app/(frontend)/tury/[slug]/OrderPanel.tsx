'use client'

import { useMemo, useState } from 'react'
import { Button, Checkbox, Input, Label, Modal, TextField } from '@heroui/react'
import { buildOrder, type OrderAddon } from '@/lib/order'
import { formatPrice } from '../format'

type Props = {
  eventId: number
  title: string
  price: number
  currency: string
  addons: OrderAddon[]
}

/**
 * Калькулятор состава поездки и заявка. Клиентский, потому что итог должен
 * пересчитываться без похода на сервер; данные приходят пропсами из RSC.
 */
export function OrderPanel({ eventId, title, price, currency, addons }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [isOpen, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const order = useMemo(
    () => buildOrder({ title, price, addons, selected }),
    [title, price, addons, selected],
  )

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    const data = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          phone: data.get('phone'),
          event: eventId,
          // Состав уходит копией — заявка должна помнить свои цены
          orderItems: order.items,
          orderTotal: order.total,
          orderCurrency: currency,
          source: window.location.pathname,
        }),
      })

      if (!res.ok) throw new Error(String(res.status))
      setDone(true)
    } catch {
      // Говорим, что делать, а не «что-то пошло не так»
      setError('Не удалось отправить заявку. Проверьте связь и попробуйте ещё раз.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section aria-label="Состав поездки" className="bg-surface rounded-2xl p-6">
      <p className="text-muted text-sm">Стоимость</p>
      <p className="mt-1 text-3xl font-extrabold" data-testid="order-total">
        {formatPrice(order.total, currency)}
      </p>

      {addons.length > 0 && (
        <fieldset className="mt-6">
          <legend className="mb-3 font-semibold">Добавить к билету</legend>
          <div className="flex flex-col gap-3">
            {addons.map((addon) => (
              <Checkbox
                key={addon.id}
                isSelected={selected.includes(addon.id)}
                onChange={(on) => toggle(addon.id, on)}
                className="w-full"
              >
                <Checkbox.Content className="w-full">
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="flex w-full justify-between gap-4">
                    <span>{addon.label}</span>
                    <span className="text-muted">+{formatPrice(addon.price, currency)}</span>
                  </span>
                </Checkbox.Content>
              </Checkbox>
            ))}
          </div>
        </fieldset>
      )}

      <ul className="mt-6 flex flex-col gap-1 text-sm" data-testid="order-items">
        {order.items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex justify-between gap-4">
            <span>{item.label}</span>
            <span className="text-muted">{formatPrice(item.price, currency)}</span>
          </li>
        ))}
      </ul>

      <Modal>
        <Button variant="primary" className="mt-6 w-full" onPress={() => setOpen(true)}>
          Оставить заявку
        </Button>

        <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[420px]">
              <Modal.CloseTrigger />

              {done ? (
                <>
                  <Modal.Header>
                    <Modal.Heading>Заявка принята</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>Менеджер свяжется с вами в течение рабочего дня.</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="primary" onPress={() => setOpen(false)}>
                      Закрыть
                    </Button>
                  </Modal.Footer>
                </>
              ) : (
                <form onSubmit={submit}>
                  <Modal.Header>
                    <Modal.Heading>Заявка на поездку</Modal.Heading>
                  </Modal.Header>

                  <Modal.Body>
                    <p className="text-muted mb-4 text-sm">
                      {title} — {formatPrice(order.total, currency)}
                    </p>

                    <div className="flex flex-col gap-4">
                      <TextField name="name" isRequired>
                        <Label>Имя</Label>
                        <Input placeholder="Как к вам обращаться" />
                      </TextField>

                      <TextField name="phone" type="tel" isRequired>
                        <Label>Телефон</Label>
                        <Input placeholder="+7 900 000-00-00" />
                      </TextField>
                    </div>

                    {error && (
                      <p role="alert" className="text-accent mt-4 text-sm">
                        {error}
                      </p>
                    )}
                  </Modal.Body>

                  <Modal.Footer>
                    <Button type="submit" variant="primary" isPending={sending}>
                      Отправить
                    </Button>
                  </Modal.Footer>
                </form>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <p className="text-muted mt-3 text-xs">
        Менеджер перезвонит, уточнит детали и рассчитает визу. Оплаты на сайте нет.
      </p>
    </section>
  )
}
