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
  discount: number;
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

export type TransactionType = 'DEBT' | 'SALE' | 'REFUND';
export type PaymentType = 'CASH' | 'CARD' | 'CREDIT';
export type TransactionStatus = 'ACTIVE' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface Transaction {
  id: string;
  marketId: string;
  createdById: string;
  debtorId: string | null;
  refundOfId: string | null;
  type: TransactionType;
  paymentType: PaymentType;
  totalAmount: number;
  discountAmount: number;
  remainingAmount: number;
  status: TransactionStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransactionItem[];
  createdBy: UserInfo;
  debtor: DebtorInfo | null;
  market: MarketInfo;
  payments: Payment[];
}

// Цена всегда берётся сервером из карточки товара — с фронта она не отправляется,
// только скидка на позицию (если она разрешена бизнес-процессом).
export interface CreateTransactionItemRequest {
  productId: string;
  quantity: number;
  discount?: number;
}
export interface CreateTransactionRequest {
  debtorId?: string;
  type: TransactionType;
  paymentType: PaymentType;
  dueDate?: string;
  items: CreateTransactionItemRequest[];
}
export interface UpdateTransactionRequest {
  debtorId?: string;
  type?: TransactionType;
  paymentType?: PaymentType;
  dueDate?: string;
}
export interface CreatePaymentRequest {
  amount: number;
  note: string;
}
export type TransactionsResponse = ApiResponse<PaginatedData<Transaction>>;
export type TransactionDetailResponse = ApiResponse<Transaction>;
