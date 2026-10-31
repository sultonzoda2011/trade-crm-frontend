import type { MetricComparison, ProductMetrics } from '~/types/analytics';
import type { ApiResponse, PaginatedData } from '~/types/common';
import type { Market, MarketInfo } from '~/types/markets';

export interface ProductCount {
  transactionItems: number;
}

export type ProductUnit = 'PCS' | 'KG' | 'L' | 'M' | 'BOX';

export interface CategoryInfo {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: ProductUnit;
  lowStockThreshold: number;
  /** Закупочная цена. Бэкенд отдаёт её только ADMIN/OWNER; у продавца поля нет. */
  costPrice?: number | null;
  image: string | null;
  /** Архивный товар скрыт из списка по умолчанию и не продаётся. Нет поля (старый кэш) = активный. */
  isActive?: boolean;
  archivedAt?: string | null;
  marketId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Backend deliberately omits `category.image` elsewhere but DOES send market.address here (rendered in the market block on the product page) — keep in sync with `productInclude` in products.service.ts. */
  market: Pick<MarketInfo, 'id' | 'name' | 'image' | 'address'>;
  category: CategoryInfo | null;
  _count: ProductCount;
  /** Period metrics computed by the backend. Present on list and detail. */
  metrics: ProductMetrics;
}

/** All-time sales totals shown on the product card, net of refunds. */
export interface ProductSalesStats {
  count: number;
  unitsSold: number;
  refundedUnits: number;
  revenue: number;
}

export interface ProductDetail extends Product {
  sales: ProductSalesStats;
  comparison: {
    netUnitsSold: MetricComparison;
    revenue: MetricComparison;
    transactionCount: MetricComparison;
  };
}
/** Что окну «Пополнить» нужно знать о товаре — берётся со страницы товара. */
export interface RestockTarget {
  id: string;
  name: string;
  quantity: number;
  unit: ProductUnit;
}
/** Цель для окон «Списать» и «Пересчитать» — те же поля, что у «Пополнить». */
export type StockTarget = RestockTarget;

export type StockMovementType = 'OPENING' | 'SALE' | 'REFUND' | 'VOID' | 'RESTOCK' | 'WRITE_OFF' | 'ADJUSTMENT';

export const WRITE_OFF_REASONS = ['DAMAGED', 'EXPIRED', 'LOST', 'OWN_USE', 'OTHER'] as const;
export type WriteOffReason = (typeof WRITE_OFF_REASONS)[number];

/** Одна строка журнала остатка. `delta` со знаком, `balanceAfter` — остаток сразу после. */
export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  delta: number;
  balanceAfter: number;
  /** Причина списания (только WRITE_OFF). */
  reason: WriteOffReason | null;
  note: string | null;
  transactionId: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
  transaction: { id: string; type: string } | null;
}
export type StockMovementsResponse = ApiResponse<PaginatedData<StockMovement>>;

/** Сводка склада для шапки раздела (только ADMIN/OWNER). Считается по активным товарам. */
export interface ProductsSummary {
  activeProducts: number;
  archivedProducts: number;
  outOfStock: number;
  lowStock: number;
  stockRetailValue: number;
  stockCostValue: number;
  potentialProfit: number;
  /** Сколько активных товаров без закупочной цены — их нет в stockCostValue/potentialProfit. */
  productsWithoutCost: number;
}
export type ProductsSummaryResponse = ApiResponse<ProductsSummary>;

export interface BulkPricePayload {
  percent: number;
  categoryId?: string;
  roundTo?: number;
  dryRun?: boolean;
}
export interface BulkPriceResult {
  dryRun: boolean;
  count: number;
  /** Только в dryRun, первые 20. */
  items: { id: string; name: string; oldPrice: number; newPrice: number }[];
}
export type BulkPriceResponse = ApiResponse<BulkPriceResult>;

export interface ProductInfo {
  id: string;
  name: string;
  price: number;
  image: string | null;
}
export type ProductsResponse = ApiResponse<PaginatedData<Product>>;
export type ProductDetailResponse = ApiResponse<ProductDetail>;

export interface Category {
  id: string;
  name: string;
  description: string | null;
  marketId: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { products: number };
}
export interface CategoryDetail {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  marketId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}
export type CategoriesResponse = ApiResponse<PaginatedData<Category>>;
export type CategoryDetailResponse = ApiResponse<CategoryDetail>;
export interface CategoryFullData {
  category: CategoryDetail;
  market: Market | null;
  products: PaginatedData<Product>;
}
export type CategoryFullResponse = ApiResponse<CategoryFullData>;
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image?: string;
}
export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;
