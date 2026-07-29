import type { FieldHook } from 'payload'

/**
 * Подставляет ночи по дням: поездка на 8 дней — это 7 ночей.
 *
 * Именно подставляет, а не вычисляет всегда: бывает «3 дня / 3 ночи», когда обратный
 * перелёт ночной. Введённое руками значение не трогаем.
 */
export const fillNights: FieldHook = ({ value, siblingData }) => {
  if (typeof value === 'number') return value

  const days = siblingData?.days

  if (typeof days !== 'number' || days < 1) return value

  return days - 1
}
