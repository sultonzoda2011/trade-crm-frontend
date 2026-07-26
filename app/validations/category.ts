import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createCategorySchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    description: z.string().optional(),
    image: z.any().optional(),
  });

export type CreateCategorySchema = z.infer<ReturnType<typeof createCategorySchema>>;

export const updateCategorySchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('nameRequired', { ns: 'validation' })),
    description: z.string().optional(),
    image: z.any().optional(),
  });

export type UpdateCategorySchema = z.infer<ReturnType<typeof updateCategorySchema>>;
