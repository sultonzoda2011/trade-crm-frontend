import type { ApiResponse, PaginatedData } from '~/types/common';

/** Человек в составе рынка. У продавца чужой `email` сервер не отдаёт. */
export interface MarketMember {
  id: string;
  name: string;
  role: string;
  image: string | null;
  email?: string;
  phone?: string | null;
}

export interface Market {
  id: string;
  name: string;
  address: string;
  image: string | null;
  /** Контактный телефон рынка. */
  phone: string | null;
  /** Часы работы свободным текстом: «Пн–Сб 8:00–18:00». */
  workHours: string | null;
  /**
   * Могут ли продавцы записывать обычные продажи (наличные/карта), а не только долги.
   * `false` по умолчанию. Включает владелец или админ.
   */
  allowSellerSales: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  users: MarketMember[];
  count: MarketCount;
  owner: MarketMember;
}
export interface MarketInfo {
  id: string;
  name: string;
  address: string;
  image: string | null;
}

export interface MarketCount {
  products: number;
  debtors: number;
  transactions: number;
}

/** Деньги рынка — только для админа и владельца; у продавца `management` = null. */
export interface MarketManagementSummary {
  totalDebt: number;
  overdueAmount: number;
  debtorsWithDebt: number;
  stockRetailValue: number;
  stockCostValue: number;
  productsWithoutCost: number;
  outOfStock: number;
  lowStock: number;
}

export interface MarketSummary {
  products: number;
  debtors: number;
  sellers: number;
  transactions: number;
  management: MarketManagementSummary | null;
}

export interface MarketOverview {
  market: Market;
  summary: MarketSummary;
}

export interface UpdateMarketSettingsRequest {
  allowSellerSales?: boolean;
}

export type MarketDetailResponse = ApiResponse<Market>;
export type MarketsResponse = ApiResponse<PaginatedData<Market>>;
export type MarketOverviewResponse = ApiResponse<MarketOverview>;
