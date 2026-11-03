import type { TFunction } from 'i18next';
import { z } from 'zod';
import { CATEGORY_COLOR_KEYS } from '~/config/categoryColors';

export const createCategorySchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, t('nameRequired', { ns: 'validation' })),
    description: z.string().optional(),
    // '' — «без цвета» (при правке уходит на сервер и снимает цвет).
    color: z.union([z.enum(CATEGORY_COLOR_KEYS), z.literal('')]).optional(),
    image: z.any().optional(),
  });

export type CreateCategorySchema = z.infer<ReturnType<typeof createCategorySchema>>;

export const updateCategorySchema = createCategorySchema;
export type UpdateCategorySchema = CreateCategorySchema;
