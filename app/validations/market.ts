import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createMarketSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('required', { ns: 'validation' })),
    address: z.string().min(1, t('required', { ns: 'validation' })),
    ownerId: z.string().min(1, t('required', { ns: 'validation' })),
    image: z.any().optional(),
  });

export type CreateMarketSchema = z.infer<ReturnType<typeof createMarketSchema>>;

export const updateMarketSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('required', { ns: 'validation' })),
    address: z.string().min(1, t('required', { ns: 'validation' })),
    ownerId: z.string().min(1, t('required', { ns: 'validation' })),
    image: z.any().optional(),
  });

export type UpdateMarketSchema = z.infer<ReturnType<typeof updateMarketSchema>>;
