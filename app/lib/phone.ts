/** Номер для `tel:` и `sms:`: цифры и ведущий плюс. */
export function toDialNumber(phone: string): string {
  const trimmed = phone.trim();
  return `${trimmed.startsWith('+') ? '+' : ''}${trimmed.replace(/\D/g, '')}`;
}
