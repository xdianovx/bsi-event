export type OrderAddon = { id: string; label: string; price: number }

export type OrderItem = { label: string; price: number }

export type Order = { items: OrderItem[]; total: number }

type BuildOrderArgs = {
  title: string
  price: number
  addons: OrderAddon[]
  selected: string[]
}

/**
 * Собирает состав заказа из билета и выбранных допок.
 *
 * Тот же результат уходит и в форму заявки — менеджер видит ровно то, что видел
 * покупатель. Порядок позиций берётся от события, а не от кликов: список должен
 * читаться одинаково независимо от того, в каком порядке отмечали.
 */
export const buildOrder = ({ title, price, addons, selected }: BuildOrderArgs): Order => {
  const chosen = addons.filter((a) => selected.includes(a.id))

  const items: OrderItem[] = [
    { label: title, price },
    ...chosen.map(({ label, price }) => ({ label, price })),
  ]

  return {
    items,
    total: items.reduce((sum, i) => sum + i.price, 0),
  }
}
