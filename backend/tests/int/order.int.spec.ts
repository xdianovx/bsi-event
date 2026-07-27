import { describe, it, expect } from 'vitest'
import { buildOrder } from '@/lib/order'

const addons = [
  { id: 'a1', label: 'Трансфер', price: 1000 },
  { id: 'a2', label: 'Страховка', price: 500 },
]

describe('buildOrder', () => {
  it('без допок итог равен цене билета', () => {
    const order = buildOrder({ title: 'Гран-при', price: 5000, addons, selected: [] })

    expect(order.total).toBe(5000)
    expect(order.items).toEqual([{ label: 'Гран-при', price: 5000 }])
  })

  it('выбранная допка попадает в состав и в сумму', () => {
    const order = buildOrder({ title: 'Гран-при', price: 5000, addons, selected: ['a1'] })

    expect(order.total).toBe(6000)
    expect(order.items).toEqual([
      { label: 'Гран-при', price: 5000 },
      { label: 'Трансфер', price: 1000 },
    ])
  })

  it('складывает несколько допок', () => {
    const order = buildOrder({ title: 'Гран-при', price: 5000, addons, selected: ['a1', 'a2'] })

    expect(order.total).toBe(6500)
    expect(order.items).toHaveLength(3)
  })

  it('игнорирует выбор несуществующей допки, а не падает', () => {
    const order = buildOrder({ title: 'Гран-при', price: 5000, addons, selected: ['нет-такой'] })

    expect(order.total).toBe(5000)
    expect(order.items).toHaveLength(1)
  })

  it('порядок позиций — билет первым, дальше как заданы у события', () => {
    const order = buildOrder({ title: 'Гран-при', price: 5000, addons, selected: ['a2', 'a1'] })

    expect(order.items.map((i) => i.label)).toEqual(['Гран-при', 'Трансфер', 'Страховка'])
  })
})
