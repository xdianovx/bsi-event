'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * Заголовки свёрнутых строк репитеров.
 *
 * Без них список из трёх номеров — это три одинаковых «Item 01», и чтобы найти нужный,
 * менеджер разворачивает каждый. Payload 3 принимает только путь к компоненту:
 * строковый RowLabel из второй версии больше не работает.
 */

const money = (value?: number | null) =>
  typeof value === 'number' ? `${value.toLocaleString('ru-RU')}` : null

export const TicketRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string; price?: number; soldOut?: boolean }>()

  const parts = [data?.name, money(data?.price), data?.soldOut ? 'нет мест' : null].filter(Boolean)

  return <span>{parts.length ? parts.join(' — ') : `Билет ${rowNumber}`}</span>
}

export const AccommodationRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{
    hotelName?: string
    stars?: number
    roomName?: string
    price?: number
    soldOut?: boolean
  }>()

  const parts = [
    data?.hotelName,
    data?.stars ? `${data.stars}★` : null,
    data?.roomName,
    money(data?.price),
    data?.soldOut ? 'нет мест' : null,
  ].filter(Boolean)

  return <span>{parts.length ? parts.join(' — ') : `Размещение ${rowNumber}`}</span>
}

export const ItineraryRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ day?: number; title?: string }>()

  const day = data?.day ?? rowNumber

  return <span>{data?.title ? `День ${day} — ${data.title}` : `День ${day}`}</span>
}

export const PaidSeparatelyRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ price?: number }>()

  const price = money(data?.price)

  return <span>{price ? `Доп — ${price}` : `Доп ${rowNumber}`}</span>
}
