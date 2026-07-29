import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * Правила слоёв FSD. Без них структура разъезжается за месяц: кто-нибудь
 * импортирует виджет из entity, и слои превращаются в папки без смысла.
 *
 * Порядок сверху вниз: app → widgets → features → entities → shared.
 * Импортировать можно только вниз. Слой cms (Payload) стоит сбоку: он часть
 * приложения и может тянуть shared, но не UI-слои.
 */
const layerRule = (files, forbidden, message) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: forbidden.map((group) => ({ group: [group], message })) },
    ],
  },
})

const fsdRules = [
  layerRule(
    ['src/shared/**'],
    ['@/entities/**', '@/features/**', '@/widgets/**', '@/app/**', '@/cms/**'],
    'shared — самый нижний слой: он не знает ни о ком выше.',
  ),
  layerRule(
    ['src/entities/**'],
    ['@/features/**', '@/widgets/**', '@/app/**', '@/cms/**'],
    'entities может тянуть только shared и соседние entities.',
  ),
  layerRule(
    ['src/features/**'],
    ['@/widgets/**', '@/app/**', '@/cms/**'],
    'features может тянуть entities и shared, но не виджеты.',
  ),
  layerRule(
    ['src/widgets/**'],
    ['@/app/**'],
    'widgets не знает о маршрутах.',
  ),
  layerRule(
    ['src/cms/**'],
    ['@/widgets/**', '@/features/**', '@/entities/*/ui/**', '@/app/**'],
    'cms — серверная часть: UI-слои сюда тянуть нельзя, иначе Payload и сид ' +
      'потащат React через бочку слайса.',
  ),
  {
    // Импорт мимо публичного API слайса ломает саму идею слоёв: внутренности
    // становятся частью контракта, и слайс уже не переписать.
    files: ['src/**'],
    ignores: ['src/shared/**', 'src/entities/*/**', 'src/features/*/**', 'src/widgets/*/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/entities/*/*', '@/features/*/*', '@/widgets/*/*'],
              message: 'Импортируйте из публичного API слайса: @/entities/event, а не вглубь.',
            },
          ],
        },
      ],
    },
  },
]

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  ...fsdRules,
  {
    // .agents и .claude — инструментарий редактора, а не код проекта
    ignores: [
      '.next/',
      '.agents/',
      '.claude/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
    ],
  },
]

export default eslintConfig
