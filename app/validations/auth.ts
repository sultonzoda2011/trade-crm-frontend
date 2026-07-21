import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createLoginSchema = (t: TFunction) =>
  z.object({
    email: z.email().min(1, t('emailRequired')),
    password: z.string().min(1, t('passwordRequired')),
  });

export type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;
