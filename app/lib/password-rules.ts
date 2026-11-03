/**
 * Правило пароля — то же, что проверяет бэкенд (`PASSWORD_PATTERN` в
 * src/common/utils/password.util.ts): от 8 символов, строчная, заглавная, цифра.
 * Каждое правило — отдельный пункт, чтобы чек-лист на экране показывал, чего
 * именно не хватает, а не общее «слабый пароль».
 */
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRuleId = 'length' | 'lower' | 'upper' | 'digit';

export const PASSWORD_RULES: { id: PasswordRuleId; test: (value: string) => boolean }[] = [
  { id: 'length', test: (v) => v.length >= PASSWORD_MIN_LENGTH },
  { id: 'lower', test: (v) => /[a-z]/.test(v) },
  { id: 'upper', test: (v) => /[A-Z]/.test(v) },
  { id: 'digit', test: (v) => /\d/.test(v) },
];

export const isStrongPassword = (value: string): boolean => PASSWORD_RULES.every((rule) => rule.test(value));

const PASSWORD_ALPHABET = {
  // Без похожих символов (I l 1 O 0): пароль часто диктуют по телефону.
  lower: 'abcdefghijkmnopqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digit: '23456789',
} as const;

/**
 * Пароль для нового продавца: 10 символов, всегда со строчной, заглавной и цифрой —
 * проходит те же правила, что и проверка бэкенда. Случайность — из `crypto`.
 */
export function generatePassword(length = 10): string {
  const groups = Object.values(PASSWORD_ALPHABET);
  const all = groups.join('');
  const random = (max: number) => {
    const buf = new Uint32Array(1);
    // Отбрасываем хвост, чтобы остаток от деления не смещал распределение.
    const limit = Math.floor(0xffffffff / max) * max;
    do crypto.getRandomValues(buf);
    while (buf[0]! >= limit);
    return buf[0]! % max;
  };
  const chars = groups.map((g) => g[random(g.length)]!);
  while (chars.length < length) chars.push(all[random(all.length)]!);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join('');
}
