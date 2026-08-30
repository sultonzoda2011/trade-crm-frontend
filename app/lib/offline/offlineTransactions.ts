// app/lib/offline/offlineTransactions.ts
//
// Локальная копия бизнес-логики TransactionsService.create/pay/refund
// (backend/src/transactions/transactions.service.ts). Используется ТОЛЬКО
// когда устройства нет сети — как только появляется интернет, эти же
// действия реплеятся на сервер через outbox (см. syncEngine.ts), и именно
// серверный ответ становится источником правды (перезаписывает то, что
// здесь было посчитано оптимистично).
//
// Что НЕ дублируется здесь намеренно (упрощение, а не забытый кейс):
//  - гонки за остаток товара между двумя офлайн-продавцами одного маркета —
//    при синхронизации сервер применит свою атомарную проверку stock и
//    вернёт ошибку конкретно по этой операции, если остатка не хватит;
//  - право SELLER создавать только DEBT — тоже перепроверяется сервером
//    при replay, здесь только зеркалим для мгновенного отклика в UI.
import { getUserInfo } from '~/lib/auth-utils';
import { getRecord, listRecords, upsertRecord } from '~/lib/offline/db';
import { newLocalId } from '~/lib/offline/localIds';
import type { OfflineDebtor, OfflineProduct } from '~/lib/offline/types';
import type { DebtorInfo } from '~/types/debtors';
import type { MarketInfo } from '~/types/markets';
import type {
  CreatePaymentRequest,
  CreateTransactionRequest,
  RefundItemRequest,
  Transaction,
  TransactionItem,
} from '~/types/transactions';

const round2 = (n: number): number => Math.round(n * 100) / 100;

function currentActor() {
  const user = getUserInfo();
  if (!user) throw new Error('No authenticated user in local session');
  return user;
}

function marketInfoStub(marketId: string): MarketInfo {
  // Полная карточка маркета офлайн не нужна нигде, где мы её тут же не
  // перезапишем данными из pull — только чтобы Transaction соответствовал
  // типу до следующей синхронизации.
  return { id: marketId, name: '', address: '', image: '' };
}

/** Создание SALE/DEBT офлайн — зеркало TransactionsService.create(). */
export async function createTransactionOffline(dto: CreateTransactionRequest): Promise<Transaction> {
  const user = currentActor();
  const marketId = user.marketId;
  const isDebt = dto.type === 'DEBT';

  const products = await listRecords<OfflineProduct>('products');
  const productMap = new Map(products.map((p) => [p.id, p]));

  let debtor: DebtorInfo | null = null;
  if (isDebt && dto.debtorId) {
    const localDebtor = await getRecord<OfflineDebtor>('debtors', dto.debtorId);
    debtor = localDebtor ? { id: localDebtor.id, name: localDebtor.name, phone: localDebtor.phone } : null;
  }

  let itemsTotal = 0;
  let discountTotal = 0;
  let markupTotal = 0;
  const items: TransactionItem[] = [];
  const stockDeltas: { productId: string; delta: number }[] = [];

  const txId = newLocalId();
  const now = new Date().toISOString();

  for (const line of dto.items) {
    const product = productMap.get(line.productId);
    if (!product) throw new Error(`Product ${line.productId} is not in the local cache`);
    if (product.quantity < line.quantity) {
      throw new Error(`errors.insufficientStock:${product.name}`);
    }
    const discount = line.discount ?? 0;
    const markup = line.markup ?? 0;
    const lineTotal = line.quantity * product.price - discount + markup;
    if (lineTotal < 0) throw new Error(`errors.discountExceedsTotal:${product.name}`);

    itemsTotal += lineTotal;
    discountTotal += discount;
    markupTotal += markup;
    stockDeltas.push({ productId: product.id, delta: -line.quantity });

    items.push({
      id: newLocalId(),
      transactionId: txId,
      productId: product.id,
      productName: product.name,
      quantity: line.quantity,
      price: product.price,
      discount,
      markup,
      totalPrice: round2(lineTotal),
      refundedQuantity: 0,
      refundOfItemId: null,
      product: { id: product.id, name: product.name, price: product.price, image: product.image ?? '' },
    });
  }

  const transaction: Transaction = {
    id: txId,
    marketId,
    createdById: user.id,
    debtorId: isDebt ? (dto.debtorId ?? null) : null,
    customerName: isDebt ? null : (dto.customerName ?? null),
    refundOfId: null,
    type: dto.type,
    paymentType: dto.paymentType,
    totalAmount: round2(itemsTotal),
    discountAmount: round2(discountTotal),
    markupAmount: round2(markupTotal),
    remainingAmount: isDebt ? round2(itemsTotal) : 0,
    status: isDebt ? 'ACTIVE' : 'PAID',
    dueDate: dto.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
    items,
    createdBy: { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role } as any,
    debtor,
    market: marketInfoStub(marketId),
    payments: [],
  };

  // Списываем сток локально, чтобы следующая офлайн-продажа того же товара
  // видела актуальный остаток, а не устаревший снапшот из последнего pull.
  for (const { productId, delta } of stockDeltas) {
    const product = productMap.get(productId)!;
    await upsertRecord('products', { ...product, quantity: product.quantity + delta, updatedAt: now });
  }
  await upsertRecord('transactions', transaction);

  return transaction;
}

/** Оплата долга офлайн — зеркало TransactionsService.pay(). */
export async function payTransactionOffline(id: string, dto: CreatePaymentRequest): Promise<Transaction> {
  const user = currentActor();
  const transaction = await getRecord<Transaction>('transactions', id);
  if (!transaction) throw new Error(`errors.transactionNotFoundLocally`);
  if (transaction.remainingAmount <= 0) throw new Error('errors.alreadyPaid');
  if (dto.amount > transaction.remainingAmount) throw new Error('errors.paymentExceedsRemaining');

  const now = new Date().toISOString();
  const newRemaining = round2(transaction.remainingAmount - dto.amount);

  const updated: Transaction = {
    ...transaction,
    remainingAmount: newRemaining,
    status: newRemaining <= 0 ? 'PAID' : 'PARTIAL',
    updatedAt: now,
    payments: [
      {
        id: newLocalId(),
        transactionId: id,
        amount: dto.amount,
        note: dto.note ?? null,
        createdById: user.id,
        createdAt: now,
        createdBy: { id: user.id, name: user.name, email: user.email, image: user.image } as any,
      },
      ...transaction.payments,
    ],
  };

  await upsertRecord('transactions', updated);
  return updated;
}

/** Возврат (полный или частичный) офлайн — зеркало TransactionsService.refund(). */
export async function refundTransactionOffline(
  id: string,
  items?: RefundItemRequest[]
): Promise<Transaction> {
  const user = currentActor();
  const original = await getRecord<Transaction>('transactions', id);
  if (!original) throw new Error('errors.transactionNotFoundLocally');
  if (original.type !== 'SALE') throw new Error('errors.onlySaleCanBeRefunded');
  if (original.status !== 'PAID' && original.status !== 'PARTIALLY_REFUNDED') {
    throw new Error('errors.onlyPaidCanBeRefunded');
  }

  const itemMap = new Map(original.items.map((i) => [i.id, i]));
  const requested = items?.length
    ? items.map((req) => {
        const item = itemMap.get(req.itemId);
        if (!item) throw new Error('errors.itemNotInTransaction');
        const refundable = item.quantity - item.refundedQuantity;
        if (req.quantity > refundable) throw new Error('errors.refundExceedsRemaining');
        return { item, quantity: req.quantity };
      })
    : original.items
        .filter((item) => item.quantity - item.refundedQuantity > 0)
        .map((item) => ({ item, quantity: item.quantity - item.refundedQuantity }));

  if (requested.length === 0) throw new Error('errors.alreadyRefunded');

  const now = new Date().toISOString();
  const refundTxId = newLocalId();
  const products = await listRecords<OfflineProduct>('products');
  const productMap = new Map(products.map((p) => [p.id, p]));

  const refundItems: TransactionItem[] = requested.map(({ item, quantity }) => {
    const unitNet = item.totalPrice / item.quantity;
    const discount = round2((item.discount / item.quantity) * quantity);
    const markup = round2((item.markup / item.quantity) * quantity);
    const totalPrice = round2(unitNet * quantity);
    return {
      id: newLocalId(),
      transactionId: refundTxId,
      productId: item.productId,
      productName: item.productName,
      quantity,
      price: item.price,
      discount,
      markup,
      totalPrice,
      refundedQuantity: 0,
      refundOfItemId: item.id,
      product: item.product,
    };
  });

  const refundTotal = round2(refundItems.reduce((s, i) => s + i.totalPrice, 0));

  const refundedByItem = new Map(requested.map((r) => [r.item.id, r.quantity]));
  const updatedOriginalItems = original.items.map((item) => {
    const refundedNow = refundedByItem.get(item.id) ?? 0;
    return { ...item, refundedQuantity: item.refundedQuantity + refundedNow };
  });
  const fullyRefunded = updatedOriginalItems.every((item) => item.refundedQuantity >= item.quantity);

  const refundTx: Transaction = {
    id: refundTxId,
    marketId: original.marketId,
    createdById: user.id,
    debtorId: original.debtorId,
    customerName: null,
    refundOfId: original.id,
    type: 'REFUND',
    paymentType: original.paymentType,
    totalAmount: refundTotal,
    discountAmount: round2(refundItems.reduce((s, i) => s + i.discount, 0)),
    markupAmount: round2(refundItems.reduce((s, i) => s + i.markup, 0)),
    remainingAmount: 0,
    status: 'PAID',
    dueDate: null,
    createdAt: now,
    updatedAt: now,
    items: refundItems,
    createdBy: { id: user.id, name: user.name, email: user.email, image: user.image } as any,
    debtor: original.debtor,
    market: original.market,
    payments: [],
  };

  await upsertRecord('transactions', {
    ...original,
    items: updatedOriginalItems,
    status: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
    updatedAt: now,
  });
  await upsertRecord('transactions', refundTx);

  // Возвращаем товар на локальный склад.
  for (const line of refundItems) {
    const product = productMap.get(line.productId);
    if (product) {
      await upsertRecord('products', { ...product, quantity: product.quantity + line.quantity, updatedAt: now });
    }
  }

  return refundTx;
}
