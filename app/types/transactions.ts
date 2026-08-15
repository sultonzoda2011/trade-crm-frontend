import type { ApiResponse, PaginatedData } from '~/types/common';
import type { DebtorInfo } from '~/types/debtors';
import type { MarketInfo } from '~/types/markets';
import type { ProductInfo } from '~/types/products';
import type { UserInfo } from '~/types/users';

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  totalPrice: number;
  /** Units of this line already returned. Single source of truth for refunds. */
  refundedQuantity: number;
  /** Set on refund lines: which original sale line this reverses. */
  refundOfItemId: string | null;
  product: ProductInfo;
}

/** Detail view adds how much of the line may still be returned. */
export interface TransactionDetailItem extends TransactionItem {
  refundableQuantity: number;
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
export type TransactionStatus = 'ACTIVE' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

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

/** One line of a partial refund. Refers to the original SALE line, not a product. */
export interface RefundItemRequest {
  itemId: string;
  quantity: number;
}

/**
 * Omit `items` to return everything still refundable on the transaction;
 * pass them to return specific lines in specific quantities.
 */
export interface RefundTransactionRequest {
  items?: RefundItemRequest[];
  reason?: string;
}

/** A related transaction shown on the detail page (original sale or a refund). */
export interface RelatedTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  totalAmount: number;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
    refundOfItemId: string | null;
  }>;
}

/** Money breakdown of one transaction, computed by the backend. */
export interface TransactionSummary {
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  remainingAmount: number;
  refundedAmount: number;
  /** What the transaction is actually worth after refunds. */
  netAmount: number;
}

export type TimelineEventType = TransactionType | 'PAYMENT';

/** Sale → payments → refunds on one axis, sorted oldest first. */
export interface TransactionTimelineEvent {
  type: TimelineEventType;
  at: string;
  amount: number;
  actor: string | null;
  transactionId: string;
}

export interface TransactionDetail extends Omit<Transaction, 'items'> {
  items: TransactionDetailItem[];
  refundOf: RelatedTransaction | null;
  refunds: RelatedTransaction[];
  summary: TransactionSummary;
  timeline: TransactionTimelineEvent[];
}

export type TransactionsResponse = ApiResponse<PaginatedData<Transaction>>;
export type TransactionResponse = ApiResponse<Transaction>;
export type TransactionDetailResponse = ApiResponse<TransactionDetail>;
