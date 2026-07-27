import { Unbounded, Golos_Text, JetBrains_Mono } from 'next/font/google'

// Контент русский, поэтому кириллица — обязательное условие, а не пожелание:
// она и определила выбор пары.

/** Дисплей: заголовки, название события на карточке. Употреблять сдержанно. */
export const display = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '600', '800'],
  variable: '--font-display',
  display: 'swap',
})

/** Основной текст. Сделан под кириллицу. */
export const body = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

/** Даты, цены, номера — как печать на билете. */
export const mono = JetBrains_Mono({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})
