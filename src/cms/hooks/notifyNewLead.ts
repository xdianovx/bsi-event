import type { CollectionAfterChangeHook } from 'payload'

// Уведомление менеджера о новой заявке (Telegram-бот / почта).
//
// Требование (spec: «Поток заявки», «Ошибки и деградация»):
//   лид уже сохранён в БД к моменту вызова afterChange. Уведомление
//   НЕ должно ронять запрос — любая ошибка логируется и глотается,
//   менеджер в любом случае видит заявку в админке.
//
// TODO: подключить реальную отправку. Креды из env:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (и/или SMTP_*).
export const notifyNewLead: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  try {
    req.payload.logger.info(
      `Новая заявка #${doc.id}: ${doc.name}, ${doc.phone}` +
        (doc.source ? ` (источник: ${doc.source})` : ''),
    )
    // await sendTelegram(`Новая заявка: ${doc.name}, ${doc.phone}`)
  } catch (err) {
    req.payload.logger.error({ err }, 'Не удалось отправить уведомление о заявке')
  }

  return doc
}
