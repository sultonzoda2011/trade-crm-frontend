import type { ApiResponse, PaginatedData } from './common';
import type { DebtorInfo } from './debtors';
import type { MarketInfo } from './markets';
import type { ProductInfo } from './products';
import type { UserInfo } from './users';

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  product: ProductInfo;
}

export interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  note: string | null;
  createdById: string;
  createdAt: string;
  createdBy: UserInfo;
}

export type TransactionType = 'DEBT' | 'SALE';
export type PaymentType = 'CASH' | 'CARD' | 'CREDIT';
export type TransactionStatus = 'ACTIVE' | 'PARTIAL' | 'PAID';

export interface Transaction {
  id: string;
  marketId: string;
  createdById: string;
  debtorId: string | null;
  type: TransactionType;
  paymentType: PaymentType;
  totalAmount: number;
  remainingAmount: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  items: TransactionItem[];
  createdBy: UserInfo;
  debtor: DebtorInfo | null;
  market: MarketInfo;
  payments: Payment[];
}
export interface CreateTransactionItemRequest {
  productId: string;
  quantity: number;
  price: number;
}
export interface CreateTransactionRequest {
  debtorId: string;
  type: TransactionType;
  paymentType: PaymentType;
  items: CreateTransactionItemRequest[];
}
export interface UpdateTransactionRequest {
  debtorId: string;
  type: TransactionType;
  paymentType: PaymentType;
}
export interface CreatePaymentRequest {
  amount: number;
  note: string;
}
export type TransactionsResponse = ApiResponse<PaginatedData<Transaction>>;
export type TransactionDetailResponse = ApiResponse<Transaction>;
