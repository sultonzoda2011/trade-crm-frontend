import type { TFunction } from 'i18next';
import { z } from 'zod';

export const requestDebtorSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    phone: z.string().min(1, t('phoneRequired', { ns: 'validation' })),
  });

export type RequestDebtorSchema = z.infer<ReturnType<typeof requestDebtorSchema>>;
