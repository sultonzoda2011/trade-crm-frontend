/**
 * Номер для ссылки wa.me: только цифры, в международном формате.
 * Девять цифр без кода — местный номер Таджикистана, добавляем 992 (приложение работает в TJS).
 * Остальное оставляем как введено: угадывать чужие коды стран нельзя.
 */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 9 ? `992${digits}` : digits;
}

/** Номер для `tel:` и `sms:`: цифры и ведущий плюс. */
export function toDialNumber(phone: string): string {
  const trimmed = phone.trim();
  return `${trimmed.startsWith('+') ? '+' : ''}${trimmed.replace(/\D/g, '')}`;
}
