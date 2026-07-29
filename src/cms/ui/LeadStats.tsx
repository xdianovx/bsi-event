import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { collectLeadStats } from '@/entities/lead'

const cellStyle: React.CSSProperties = {
  background: 'var(--theme-elevation-50)',
  borderRadius: '4px',
  padding: '16px 20px',
  minWidth: '140px',
}

const valueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: 1.2,
}

const labelStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-600)',
  fontSize: '13px',
  marginTop: '4px',
}

/**
 * Витрина на главной админки. Серверный компонент: считает по БД напрямую,
 * своего API-роута не заводим.
 */
export default async function LeadStats() {
  const payload = await getPayload({ config })
  const stats = await collectLeadStats(payload)

  const cells = [
    { value: stats.today, label: 'за сутки' },
    { value: stats.week, label: 'за неделю' },
    { value: stats.month, label: 'за месяц' },
    { value: stats.total, label: 'всего' },
    { value: stats.unprocessed, label: 'не обработано' },
  ]

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Заявки</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {cells.map((cell) => (
          <div key={cell.label} style={cellStyle}>
            <div
              style={{
                ...valueStyle,
                // Необработанные — то, ради чего сюда смотрят.
                // Цвет из темы Payload: в админке ни Tailwind, ни HeroUI нет.
                color:
                  cell.label === 'не обработано' && cell.value > 0
                    ? 'var(--theme-error-500)'
                    : undefined,
              }}
            >
              {cell.value}
            </div>
            <div style={labelStyle}>{cell.label}</div>
          </div>
        ))}
      </div>

      {stats.topEvents.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Чаще всего спрашивают</h3>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            {stats.topEvents.map((event) => (
              <li key={event.id} style={{ marginBottom: '4px' }}>
                {event.title}
                <span style={{ color: 'var(--theme-elevation-600)' }}> — {event.count}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
