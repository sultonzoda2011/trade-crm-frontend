import type { TFunction } from 'i18next';
import { z } from 'zod';
import type { DebtorRequest } from '~/types/debtors';

/** Число из поля ввода: пустая строка — «не задано». */
const optionalNumber = (schema: z.ZodNumber) => z.union([schema, z.literal('')]).optional();

export const requestDebtorSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    phone: z.string().min(1, t('phoneRequired', { ns: 'validation' })),
    note: z.string().max(500).optional(),
    creditLimit: optionalNumber(z.number().min(0)),
    defaultDueDays: optionalNumber(z.number().int().min(1).max(365)),
  });

export type RequestDebtorSchema = z.infer<ReturnType<typeof requestDebtorSchema>>;

/**
 * Значения формы → тело запроса: пустые необязательные поля не отправляем.
 * Поэтому очистить лимит или срок через форму нельзя — они остаются прежними.
 */
export function toDebtorRequest(values: RequestDebtorSchema): DebtorRequest {
  const note = values.note?.trim();
  return {
    name: values.name,
    phone: values.phone,
    ...(note ? { note } : {}),
    ...(typeof values.creditLimit === 'number' ? { creditLimit: values.creditLimit } : {}),
    ...(typeof values.defaultDueDays === 'number' ? { defaultDueDays: values.defaultDueDays } : {}),
  };
}

/** Оплата суммой: не больше, чем человек должен сейчас. */
export const debtorPaymentSchema = (t: TFunction, maxAmount: number) =>
  z.object({
    amount: z
      .number(t('required', { ns: 'validation' }))
      .min(0.01, t('required', { ns: 'validation' }))
      .refine((value) => value <= maxAmount, t('payDebtor.exceeds', { ns: 'debtors' })),
    note: z.string(),
  });

export type DebtorPaymentSchema = z.infer<ReturnType<typeof debtorPaymentSchema>>;
