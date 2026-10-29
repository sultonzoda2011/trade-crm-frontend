import type { TFunction } from 'i18next';
import { fmtTJS, formatDate } from '~/lib/format';
import type { TransactionDetail } from '~/types/transactions';

/** Текст чека для отправки в мессенджер: позиции, итог, оплачено и остаток. Без цены закупки и внутренних id. */
export function buildReceiptText(tx: TransactionDetail, t: TFunction): string {
  const { summary } = tx;
  const lines: string[] = [
    `${t('type.' + tx.type)} · ${formatDate(tx.createdAt, true)}`,
    tx.debtor
      ? `${t('fields.debtor')}: ${tx.debtor.name}`
      : tx.customerName
        ? `${t('fields.customer')}: ${tx.customerName}`
        : '',
    '',
    ...tx.items.map((item) => `${item.productName} × ${item.quantity} — ${fmtTJS(item.totalPrice)}`),
    '',
    `${t('summary.totalAmount')}: ${fmtTJS(summary.totalAmount)}`,
  ];
  if (summary.paidAmount > 0 && tx.type === 'DEBT')
    lines.push(`${t('summary.paidAmount')}: ${fmtTJS(summary.paidAmount)}`);
  if (summary.refundedAmount > 0) lines.push(`${t('summary.refundedAmount')}: −${fmtTJS(summary.refundedAmount)}`);
  if (summary.remainingAmount > 0) lines.push(`${t('summary.remainingAmount')}: ${fmtTJS(summary.remainingAmount)}`);
  if (tx.dueDate && summary.remainingAmount > 0) lines.push(`${t('fields.dueDate')}: ${formatDate(tx.dueDate)}`);
  if (tx.note) lines.push('', tx.note);
  return lines.filter((l, i, a) => !(l === '' && (i === 0 || a[i - 1] === ''))).join('\n');
}

/** Системное окно «Поделиться»; если его нет — копирует текст в буфер. Возвращает, что получилось. */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    // Пользователь закрыл окно «Поделиться» — это не ошибка.
    if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
    return 'failed';
  }
}
