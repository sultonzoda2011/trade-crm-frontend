// app/lib/offline/offlineOverview.ts
//
// Локальная копия GET /dashboard/overview (backend/src/dashboard/*), для
// экрана "Панель управления" (routes/(crm)/dashboard/overview.tsx) без
// сети. Период/сравнение периодов посчитаны по тем же правилам, что
// backend/src/common/utils/period.util.ts — иначе цифры офлайн и онлайн
// разъедутся, когда сеть вернётся.
//
// Сознательно НЕ реализовано офлайн (документируем, а не молчим):
//  - insights (рекомендательный движок DashboardInsightsService) — это не
//    агрегация, а набор эвристических правил с текстами; пусто, пока нет сети;
//  - inventory.slowMoving / inventory.highReturns — нужна модель "обычной
//    скорости продаж" за длительное окно, не только текущий период;
//  - все цифры общие по маркету пользователя, без разбивки sellerId!==self
//    (у SELLER и так нет доступа к дашборду — см. @Roles(ADMIN,OWNER)).
import { listRecords } from '~/lib/offline/db';
import type { OfflineProduct } from '~/lib/offline/types';
import type {
  OverviewCategoryRow,
  OverviewData,
  PaymentTypeDistribution,
  ProductLeaderRow,
  ReorderProduct,
  RevenueTrendData,
  ReturnedProductRow,
} from '~/types/dashboard';
import type { MetricComparison, ProductHealth, ProductMetrics, ReorderPriority } from '~/types/analytics';
import type { Transaction } from '~/types/transactions';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 3;

const round2 = (n: number): number => Math.round(n * 100) / 100;

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}
function shiftDays(date: Date, delta: number): Date {
  return new Date(date.getTime() + delta * MS_PER_DAY);
}
function shiftMonths(date: Date, delta: number): Date {
  const targetMonth = date.getUTCMonth() + delta;
  const daysInTarget = new Date(Date.UTC(date.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      targetMonth,
      Math.min(date.getUTCDate(), daysInTarget),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

function buildCurrentRange(period: string | undefined, now: Date): { gte: Date; lte: Date } {
  const lte = endOfUtcDay(now);
  switch (period) {
    case 'today':
      return { gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), lte };
    case 'week':
      return {
        gte: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7))
        ),
        lte,
      };
    case 'year':
      return { gte: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), lte };
    case 'month':
    default:
      return { gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), lte };
  }
}

function buildPreviousRange(period: string | undefined, current: { gte: Date; lte: Date }): { gte: Date; lte: Date } {
  switch (period) {
    case 'today':
      return { gte: shiftDays(current.gte, -1), lte: shiftDays(current.lte, -1) };
    case 'week':
      return { gte: shiftDays(current.gte, -7), lte: shiftDays(current.lte, -7) };
    case 'year':
      return { gte: shiftMonths(current.gte, -12), lte: shiftMonths(current.lte, -12) };
    case 'month':
      return { gte: shiftMonths(current.gte, -1), lte: shiftMonths(current.lte, -1) };
    default: {
      const durationMs = current.lte.getTime() - current.gte.getTime();
      return { gte: new Date(current.gte.getTime() - durationMs - 1), lte: new Date(current.gte.getTime() - 1) };
    }
  }
}

function resolvePeriod(params: { period?: string; dateFrom?: string; dateTo?: string }, now = new Date()) {
  let current: { gte: Date; lte: Date };
  if (params.period) {
    current = buildCurrentRange(params.period, now);
  } else if (params.dateFrom || params.dateTo) {
    current = {
      gte: params.dateFrom ? new Date(params.dateFrom) : new Date(0),
      lte: params.dateTo ? endOfUtcDay(new Date(params.dateTo)) : endOfUtcDay(now),
    };
  } else {
    current = buildCurrentRange('month', now);
  }
  const durationMs = Math.max(current.lte.getTime() - current.gte.getTime(), 0);
  return {
    current,
    previous: buildPreviousRange(params.period, current),
    truncUnit: params.period === 'year' ? ('month' as const) : ('day' as const),
    durationDays: Math.max(Math.round(durationMs / MS_PER_DAY), 1),
  };
}

function buildComparison(current: number, previous: number): MetricComparison {
  const difference = round2(current - previous);
  return {
    current: round2(current),
    previous: round2(previous),
    difference,
    changePercent: previous === 0 ? null : Math.round((difference / Math.abs(previous)) * 1000) / 10,
  };
}

function inRange(iso: string, range: { gte: Date; lte: Date }): boolean {
  const t = new Date(iso).getTime();
  return t >= range.gte.getTime() && t <= range.lte.getTime();
}

interface WindowTotals {
  saleGross: number;
  debtGross: number;
  refunded: number;
  discountAmount: number;
  unitsSold: number;
  refundedUnits: number;
  saleCount: number;
  debtCount: number;
  refundCount: number;
  perDay: Map<string, { revenue: number; count: number }>;
  perProduct: Map<string, { name: string; netUnits: number; netRevenue: number; refundedUnits: number }>;
  perCategory: Map<string | null, { name: string | null; netRevenue: number; netUnits: number }>;
  perPaymentType: Map<string, { amount: number; count: number }>;
}

function computeWindow(
  transactions: Transaction[],
  range: { gte: Date; lte: Date },
  productCategory: Map<string, string | null>,
  categoryName: Map<string, string>
): WindowTotals {
  const totals: WindowTotals = {
    saleGross: 0,
    debtGross: 0,
    refunded: 0,
    discountAmount: 0,
    unitsSold: 0,
    refundedUnits: 0,
    saleCount: 0,
    debtCount: 0,
    refundCount: 0,
    perDay: new Map(),
    perProduct: new Map(),
    perCategory: new Map(),
    perPaymentType: new Map(),
  };

  for (const tx of transactions) {
    if (!inRange(tx.createdAt, range)) continue;
    const dayKey = tx.createdAt.slice(0, 10);

    if (tx.type === 'SALE' || tx.type === 'DEBT') {
      const net = tx.type === 'SALE' ? tx.totalAmount : 0;
      if (tx.type === 'SALE') totals.saleGross += tx.totalAmount;
      else totals.debtGross += tx.totalAmount;
      totals.discountAmount += tx.discountAmount;
      totals.saleCount += tx.type === 'SALE' ? 1 : 0;
      totals.debtCount += tx.type === 'DEBT' ? 1 : 0;

      const day = totals.perDay.get(dayKey) ?? { revenue: 0, count: 0 };
      day.revenue += tx.totalAmount;
      day.count += 1;
      totals.perDay.set(dayKey, day);

      const pt = totals.perPaymentType.get(tx.paymentType) ?? { amount: 0, count: 0 };
      pt.amount += tx.totalAmount;
      pt.count += 1;
      totals.perPaymentType.set(tx.paymentType, pt);

      for (const item of tx.items) {
        totals.unitsSold += item.quantity;
        const p = totals.perProduct.get(item.productId) ?? {
          name: item.productName,
          netUnits: 0,
          netRevenue: 0,
          refundedUnits: 0,
        };
        p.netUnits += item.quantity;
        p.netRevenue += item.totalPrice;
        totals.perProduct.set(item.productId, p);

        const catId = productCategory.get(item.productId) ?? null;
        const cat = totals.perCategory.get(catId) ?? {
          name: catId ? (categoryName.get(catId) ?? null) : null,
          netRevenue: 0,
          netUnits: 0,
        };
        cat.netRevenue += item.totalPrice;
        cat.netUnits += item.quantity;
        totals.perCategory.set(catId, cat);
      }
      void net;
    } else if (tx.type === 'REFUND') {
      totals.refunded += tx.totalAmount;
      totals.refundCount += 1;
      const day = totals.perDay.get(dayKey) ?? { revenue: 0, count: 0 };
      day.revenue -= tx.totalAmount;
      totals.perDay.set(dayKey, day);

      for (const item of tx.items) {
        totals.refundedUnits += item.quantity;
        const p = totals.perProduct.get(item.productId) ?? {
          name: item.productName,
          netUnits: 0,
          netRevenue: 0,
          refundedUnits: 0,
        };
        p.netUnits -= item.quantity;
        p.netRevenue -= item.totalPrice;
        p.refundedUnits += item.quantity;
        totals.perProduct.set(item.productId, p);

        const catId = productCategory.get(item.productId) ?? null;
        const cat = totals.perCategory.get(catId) ?? {
          name: catId ? (categoryName.get(catId) ?? null) : null,
          netRevenue: 0,
          netUnits: 0,
        };
        cat.netRevenue -= item.totalPrice;
        cat.netUnits -= item.quantity;
        totals.perCategory.set(catId, cat);
      }
    }
  }

  return totals;
}

export async function computeOverviewOffline(params: {
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
}): Promise<OverviewData> {
  const now = new Date();
  const resolved = resolvePeriod(params, now);

  const [transactionsAll, products, categories] = await Promise.all([
    listRecords<Transaction>('transactions'),
    listRecords<OfflineProduct>('products'),
    listRecords<{ id: string; name: string }>('categories'),
  ]);

  const transactions = params.sellerId ? transactionsAll.filter((t) => t.createdById === params.sellerId) : transactionsAll;

  const productCategory = new Map(products.map((p) => [p.id, p.categoryId]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const cur = computeWindow(transactions, resolved.current, productCategory, categoryName);
  const prev = computeWindow(transactions, resolved.previous, productCategory, categoryName);

  const saleRevenueCur = round2(cur.saleGross - cur.refunded);
  const saleRevenuePrev = round2(prev.saleGross - prev.refunded);
  const netRevenueCur = round2(saleRevenueCur + cur.debtGross);
  const netRevenuePrev = round2(saleRevenuePrev + prev.debtGross);
  const txCountCur = cur.saleCount + cur.debtCount;
  const txCountPrev = prev.saleCount + prev.debtCount;
  const avgCheckCur = txCountCur > 0 ? netRevenueCur / txCountCur : 0;
  const avgCheckPrev = txCountPrev > 0 ? netRevenuePrev / txCountPrev : 0;
  const returnRateCur = cur.unitsSold > 0 ? cur.refundedUnits / cur.unitsSold : 0;
  const returnRatePrev = prev.unitsSold > 0 ? prev.refundedUnits / prev.unitsSold : 0;

  // ---- debts: снапшот на сейчас, не по периоду ----
  let totalOutstanding = 0;
  let activeDebtCount = 0;
  const activeDebtors = new Set<string>();
  let overdueAmount = 0;
  let overdueCount = 0;
  let dueSoonAmount = 0;
  let dueSoonCount = 0;
  let collectedAmount = 0;
  let collectedCount = 0;
  const dueSoonEdge = new Date(now.getTime() + DUE_SOON_DAYS * MS_PER_DAY);

  for (const tx of transactions) {
    if (tx.type === 'DEBT' && (tx.status === 'ACTIVE' || tx.status === 'PARTIAL')) {
      totalOutstanding += tx.remainingAmount;
      activeDebtCount += 1;
      if (tx.debtorId) activeDebtors.add(tx.debtorId);
      if (tx.dueDate) {
        const due = new Date(tx.dueDate);
        if (due.getTime() < now.getTime()) {
          overdueAmount += tx.remainingAmount;
          overdueCount += 1;
        } else if (due.getTime() <= dueSoonEdge.getTime()) {
          dueSoonAmount += tx.remainingAmount;
          dueSoonCount += 1;
        }
      }
    }
    for (const payment of tx.payments) {
      if (inRange(payment.createdAt, resolved.current)) {
        collectedAmount += payment.amount;
        collectedCount += 1;
      }
    }
  }

  // ---- inventory: снапшот стока, health по простым порогам ----
  const salesLast30 = computeWindow(
    transactions,
    { gte: shiftDays(now, -30), lte: now },
    productCategory,
    categoryName
  );

  let outOfStock = 0;
  let critical = 0;
  let lowStock = 0;
  let stockValue = 0;
  let noSales = 0;
  const reorder: ReorderProduct[] = [];

  for (const p of products) {
    stockValue += p.quantity * p.price;
    const half = Math.max(Math.ceil(p.lowStockThreshold / 2), 1);
    let health: ProductHealth = 'HEALTHY';
    let priority: ReorderPriority = 'NOT_NEEDED';

    if (p.quantity <= 0) {
      outOfStock += 1;
      health = 'OUT_OF_STOCK';
      priority = 'OUT_OF_STOCK';
    } else if (p.quantity <= half) {
      critical += 1;
      health = 'CRITICAL';
      priority = 'CRITICAL';
    } else if (p.quantity <= p.lowStockThreshold) {
      lowStock += 1;
      health = 'LOW_STOCK';
      priority = 'WARNING';
    }

    const sold30 = salesLast30.perProduct.get(p.id)?.netUnits ?? 0;
    if (sold30 <= 0 && health === 'HEALTHY') {
      noSales += 1;
      health = 'NO_SALES';
    }

    if (priority !== 'NOT_NEEDED') {
      const avgDaily = sold30 / 30;
      const metrics: ProductMetrics = {
        productId: p.id,
        unitsSold: cur.perProduct.get(p.id)?.netUnits ?? 0,
        refundedUnits: cur.perProduct.get(p.id)?.refundedUnits ?? 0,
        netUnitsSold: cur.perProduct.get(p.id)?.netUnits ?? 0,
        revenue: round2(cur.perProduct.get(p.id)?.netRevenue ?? 0),
        transactionCount: 0,
        returnRate: 0,
        avgDailySales: round2(avgDaily),
        daysOfStockRemaining: avgDaily > 0 ? Math.round(p.quantity / avgDaily) : null,
        reorderPriority: priority,
        recommendedQuantity: avgDaily > 0 ? Math.max(Math.ceil(avgDaily * 14 - p.quantity), 0) : 0,
        health,
      };
      reorder.push({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        lowStockThreshold: p.lowStockThreshold,
        unit: p.unit,
        image: p.image,
        category: p.categoryId ? { id: p.categoryId, name: categoryName.get(p.categoryId) ?? '' } : null,
        metrics,
      });
    }
  }
  const priorityOrder: Record<ReorderPriority, number> = {
    OUT_OF_STOCK: 0,
    CRITICAL: 1,
    WARNING: 2,
    OK: 3,
    NOT_NEEDED: 4,
  };
  reorder.sort((a, b) => priorityOrder[a.metrics.reorderPriority] - priorityOrder[b.metrics.reorderPriority]);

  // ---- products (top by revenue/units) ----
  const productRows: ProductLeaderRow[] = Array.from(cur.perProduct.entries()).map(([productId, v]) => ({
    productId,
    productName: v.name,
    netUnits: v.netUnits,
    netRevenue: round2(v.netRevenue),
    refundedUnits: v.refundedUnits,
  }));
  const topByRevenue = [...productRows].sort((a, b) => b.netRevenue - a.netRevenue).slice(0, 5);
  const topByUnits = [...productRows].sort((a, b) => b.netUnits - a.netUnits).slice(0, 5);

  // ---- returns.topProducts ----
  const returnedProducts: ReturnedProductRow[] = Array.from(cur.perProduct.entries())
    .filter(([, v]) => v.refundedUnits > 0)
    .map(([productId, v]) => {
      const unitsSold = v.netUnits + v.refundedUnits;
      return {
        productId,
        productName: v.name,
        refundedUnits: v.refundedUnits,
        refundedAmount: round2(Math.max(-v.netRevenue, 0)),
        unitsSold,
        returnRate: unitsSold > 0 ? round2(v.refundedUnits / unitsSold) : 0,
      };
    })
    .sort((a, b) => b.refundedAmount - a.refundedAmount)
    .slice(0, 5);

  // ---- categories ----
  const categoryRows: OverviewCategoryRow[] = Array.from(cur.perCategory.entries()).map(([categoryId, v]) => {
    const prevRow = prev.perCategory.get(categoryId);
    return {
      categoryId,
      categoryName: v.name,
      netRevenue: round2(v.netRevenue),
      netUnits: v.netUnits,
      comparison: buildComparison(v.netRevenue, prevRow?.netRevenue ?? 0),
    };
  });

  // ---- revenue trend (по дням текущего окна) ----
  const revenueTrend: RevenueTrendData[] = Array.from(cur.perDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, revenue: round2(v.revenue), transactionCount: v.count }));

  // ---- payment mix ----
  const paymentTotal = Array.from(cur.perPaymentType.values()).reduce((s, v) => s + v.amount, 0);
  const paymentMix: PaymentTypeDistribution[] = Array.from(cur.perPaymentType.entries()).map(([type, v]) => ({
    type: type as PaymentTypeDistribution['type'],
    count: v.count,
    amount: round2(v.amount),
    percentage: paymentTotal > 0 ? round2((v.amount / paymentTotal) * 100) : 0,
  }));

  return {
    period: {
      current: { gte: resolved.current.gte.toISOString(), lte: resolved.current.lte.toISOString() },
      previous: { gte: resolved.previous.gte.toISOString(), lte: resolved.previous.lte.toISOString() },
      durationDays: resolved.durationDays,
    },
    sales: {
      saleRevenue: saleRevenueCur,
      debtIssued: round2(cur.debtGross),
      netRevenue: netRevenueCur,
      grossRevenue: round2(cur.saleGross),
      refundedRevenue: round2(cur.refunded),
      unitsSold: cur.unitsSold,
      refundedUnits: cur.refundedUnits,
      discountAmount: round2(cur.discountAmount),
      transactionCount: txCountCur,
      saleCount: cur.saleCount,
      debtCount: cur.debtCount,
      averageCheck: round2(avgCheckCur),
      returnRate: round2(returnRateCur),
      comparison: {
        netRevenue: buildComparison(netRevenueCur, netRevenuePrev),
        transactionCount: buildComparison(txCountCur, txCountPrev),
        averageCheck: buildComparison(avgCheckCur, avgCheckPrev),
        unitsSold: buildComparison(cur.unitsSold, prev.unitsSold),
      },
    },
    debts: {
      totalOutstanding: round2(totalOutstanding),
      activeDebtCount,
      activeDebtorCount: activeDebtors.size,
      overdueAmount: round2(overdueAmount),
      overdueCount,
      dueSoonAmount: round2(dueSoonAmount),
      dueSoonCount,
      collectedAmount: round2(collectedAmount),
      collectedCount,
    },
    returns: {
      amount: round2(cur.refunded),
      units: cur.refundedUnits,
      returnRate: round2(returnRateCur),
      revenueImpact: round2(cur.refunded),
      topProducts: returnedProducts,
      comparison: {
        amount: buildComparison(cur.refunded, prev.refunded),
        returnRate: buildComparison(returnRateCur, returnRatePrev),
      },
    },
    inventory: {
      totalProducts: products.length,
      outOfStock,
      critical,
      lowStock,
      slowMoving: 0,
      noSales,
      highReturns: 0,
      healthy: Math.max(products.length - outOfStock - critical - lowStock - noSales, 0),
      needsReorder: outOfStock + critical + lowStock,
      stockValue: round2(stockValue),
      slowMovingValue: 0,
    },
    products: { topByRevenue, topByUnits, reorder: reorder.slice(0, 10) },
    categories: categoryRows,
    revenueTrend,
    paymentMix,
    insights: [],
  };
}
