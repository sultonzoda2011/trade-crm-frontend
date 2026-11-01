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
