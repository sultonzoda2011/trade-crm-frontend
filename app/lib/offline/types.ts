// app/lib/offline/types.ts
//
// Общие "облегчённые" формы сущностей для локального офлайн-кэша. Это НЕ
// то же самое, что типы из ~/types/* (Product, Debtor) — те описывают полный
// ответ обычных REST-эндпоинтов (с досчитанными на сервере market/_count/
// metrics/аналитикой должника), а здесь — то, что реально попадает в
// IndexedDB через /sync/pull и офлайн-мутации. Держим их отдельно, чтобы не
// притворяться, что офлайн-кэш содержит больше, чем есть на самом деле.
import type { ProductUnit } from '~/types/products';

export interface OfflineProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  marketId: string;
  updatedAt: string;
  createdAt: string;
  image: string | null;
  description: string | null;
  categoryId: string | null;
  unit: ProductUnit;
  lowStockThreshold: number;
}

export interface OfflineDebtor {
  id: string;
  name: string;
  phone: string;
  marketId: string;
  updatedAt: string;
}
