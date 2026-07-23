import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createProductSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('required', { ns: 'validation' })),
    description: z.string().min(1, t('required', { ns: 'validation' })),
    price: z.number().min(1, t('required', { ns: 'validation' })),
    quantity: z.number().min(0, t('required', { ns: 'validation' })),
    image: z.any().optional(),
  });

export type CreateProductSchema = z.infer<ReturnType<typeof createProductSchema>>;

export const updateProductSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(2, t('required', { ns: 'validation' })),
    description: z.string().min(1, t('required', { ns: 'validation' })),
    price: z.number().min(1, t('required', { ns: 'validation' })),
    quantity: z.number().min(0, t('required', { ns: 'validation' })),
    image: z.any().optional(),
  });

export type UpdateProductSchema = z.infer<ReturnType<typeof updateProductSchema>>;
