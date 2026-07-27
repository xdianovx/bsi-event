import { Golos_Text } from 'next/font/google'

/**
 * Единственный шрифт проекта. Golos сделан под кириллицу — контент русский.
 * Веса покрывают и текст, и заголовки, поэтому отдельная дисплейная пара не нужна.
 */
export const body = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})
