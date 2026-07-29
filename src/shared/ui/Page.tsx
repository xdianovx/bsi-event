/**
 * Ритм страницы. HeroUI задаёт только внутренние отступы компонентов, сетки и
 * секций у неё нет — поэтому расстояния между блоками наши. Держим их в одном
 * месте: иначе на каждой странице заводится своя пара mb-12 / mt-16, и через
 * пять страниц отступы разъезжаются.
 *
 * Шкала — та же, что у Tailwind и HeroUI (--spacing: 0.25rem):
 *   между секциями   gap-12 (3rem)
 *   внутри секции    gap-4  (1rem)
 */
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
      {children}
    </main>
  )
}

/** Блок страницы: заголовок и содержимое одной темы. */
export function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <section className={`flex flex-col gap-4 ${className}`}>{children}</section>
}
