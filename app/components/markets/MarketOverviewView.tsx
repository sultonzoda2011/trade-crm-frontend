import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Banknote,
  Clock,
  Package,
  PackageX,
  Phone,
  Receipt,
  ShoppingCart,
  Store,
  Trash2,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { toast } from 'sonner';
import { marketsApi } from '~/api/markets';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { ListEmpty, ListGroup, ListRow } from '~/components/shared/ListGroup';
import { Badge } from '~/components/ui/badge';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDeleteEntity } from '~/hooks/useDeleteEntity';
import { getClientUser } from '~/lib/auth-utils';
import { fmtNum, fmtTJS, formatDate } from '~/lib/format';
import { queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import { Role } from '~/types/common';
import type { MarketOverview } from '~/types/markets';

interface MarketOverviewViewProps {
  overview: MarketOverview;
}

/**
 * Главный экран рынка — «Настройки» в стиле iOS: сверху рынок (фото, название,
 * адрес), ниже группы: сводка, деньги (только админ и владелец), о рынке,
 * команда и настройки.
 *
 * Один вид на всех: админ открывает любой рынок из списка, владелец и продавец —
 * свой (из меню). Продавец видит то же самое только для чтения, без денег, без
 * почты коллег и без переключателей — а правила рынка прописаны словами.
 */
export function MarketOverviewView({ overview }: MarketOverviewViewProps) {
  const { market, summary } = overview;
  const { t } = useTranslation(['markets', 'common']);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { can } = useCan();

  const [confirmEnable, setConfirmEnable] = useState(false);

  const { requestDelete, deleteDialog } = useDeleteEntity({
    entity: 'markets',
    api: marketsApi,
    id: market.id,
    t,
    redirectTo: '/markets',
    alsoInvalidate: ['users', 'sellers', 'products', 'categories', 'debtors', 'transactions'],
  });

  const settings = useMutation({
    mutationFn: (allowSellerSales: boolean) =>
      marketsApi.updateSettings({ id: market.id, request: { allowSellerSales } }),
    // Не из очереди офлайн-операций: переключатель должен честно сказать «нет связи», а не ждать.
    networkMode: 'always',
    onSuccess: (_data, allowSellerSales) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity('markets') });
      // Продавец узнаёт правило из профиля — освежаем и его кеш.
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileAll() });
      toast.success(t(allowSellerSales ? 'settings.enabledToast' : 'settings.disabledToast'));
    },
  });

  const canSettings = can(Action.MARKETS_SETTINGS);
  const canEdit = can(Action.MARKETS_EDIT);
  const money = summary.management;

  // Пока запрос идёт, показываем новое значение сразу — переключатель не «отскакивает».
  const allowSales = settings.isPending ? Boolean(settings.variables) : market.allowSellerSales;

  const onToggle = (next: boolean) => {
    if (next) {
      setConfirmEnable(true);
      return;
    }
    settings.mutate(false);
  };

  // «Откуда пришёл» для хлебной крошки на карточке сущности и предвыбранный фильтр по рынку в списках.
  const listState = { fromPath: location.pathname, fromName: market.name };
  const filterState = { fromMarketId: market.id, fromMarketName: market.name };

  const viewer = getClientUser();
  const ownerIsMe = viewer?.id === market.ownerId;
  const ownerTo = ownerIsMe ? '/profile' : can(Action.USERS_VIEW) ? `/users/${market.ownerId}` : undefined;

  // Ссылку даём только туда, куда роль реально может зайти: иначе строка вела бы на «Нет доступа».
  const to = (action: Action, path: string) => (can(action) ? path : undefined);

  const crumbs = can(Action.MARKETS_VIEW)
    ? [
        { label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' },
        { label: t('navigation.markets', { ns: 'common' }), link: location.state?.fromPath ?? '/markets' },
        { label: market.name },
      ]
    : [{ label: t('navigation.dashboard', { ns: 'common' }), link: '/dashboard' }, { label: market.name }];

  const notSet = <span className="text-muted-foreground/70">{t('notSet')}</span>;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-5 pb-6 md:max-w-xl">
      <BreadCrumbs items={crumbs} />

      {/* Рынок: фото, название, адрес и два быстрых действия. */}
      <section className="bg-card relative overflow-hidden rounded-2xl p-5 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(90% 120% at 50% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col items-center gap-3">
          <EntityAvatar
            name={market.name}
            image={market.image}
            icon={Store}
            shape="square"
            size="xl"
            className="size-24 rounded-[1.7rem]"
          />
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl leading-tight font-bold tracking-tight break-words">{market.name}</h1>
            <p className="text-muted-foreground text-sm break-words">{market.address}</p>
          </div>
          {(market.phone || canEdit) && (
            <div className="flex w-full flex-wrap justify-center gap-2">
              {market.phone && (
                <Button
                  variant="secondary"
                  size="sm"
                  render={<a href={`tel:${market.phone.replace(/[^\d+]/g, '')}`} />}>
                  <Phone />
                  {t('call')}
                </Button>
              )}
              {canEdit && (
                <Button variant="secondary" size="sm" render={<Link to={`/markets/${market.id}/edit`} />}>
                  {t('actions.edit', { ns: 'common' })}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <ListGroup title={t('sections.summary')}>
        <ListRow
          leading={<Package className="text-primary size-5" />}
          title={t('fields.products')}
          value={fmtNum(summary.products)}
          to={to(Action.PRODUCTS_VIEW, '/products')}
          state={filterState}
        />
        <ListRow
          leading={<Wallet className="text-primary size-5" />}
          title={t('fields.debtors')}
          value={fmtNum(summary.debtors)}
          to={to(Action.DEBTORS_VIEW, '/debtors')}
          state={filterState}
        />
        <ListRow
          leading={<Users className="text-primary size-5" />}
          title={t('fields.sellers')}
          value={fmtNum(summary.sellers)}
          to={to(Action.SELLERS_VIEW, '/sellers')}
          state={filterState}
        />
        <ListRow
          leading={<Receipt className="text-primary size-5" />}
          title={t('fields.transactions')}
          value={fmtNum(summary.transactions)}
          to={to(Action.TRANSACTIONS_VIEW, '/transactions')}
          state={filterState}
        />
      </ListGroup>

      {money && (
        <ListGroup
          title={t('sections.money')}
          footer={
            money.productsWithoutCost > 0 ? t('money.noCostHint', { count: money.productsWithoutCost }) : undefined
          }>
          <ListRow
            leading={<Banknote className="text-primary size-5" />}
            title={t('money.totalDebt')}
            subtitle={
              money.debtorsWithDebt > 0 ? t('money.debtorsWithDebt', { count: money.debtorsWithDebt }) : undefined
            }
            value={fmtTJS(money.totalDebt)}
            valueClassName={cn('font-mono font-semibold', money.totalDebt > 0 ? 'text-foreground' : undefined)}
            to={to(Action.DEBTORS_VIEW, '/debtors')}
            state={filterState}
          />
          {money.overdueAmount > 0 && (
            <ListRow
              leading={<AlertTriangle className="text-destructive size-5" />}
              title={t('money.overdue')}
              value={fmtTJS(money.overdueAmount)}
              valueClassName="font-mono font-semibold text-destructive"
              to={to(Action.DEBTORS_VIEW, '/debtors')}
              state={filterState}
            />
          )}
          <ListRow
            leading={<Warehouse className="text-primary size-5" />}
            title={t('money.stockValue')}
            subtitle={t('money.stockCost', { value: fmtTJS(money.stockCostValue) })}
            value={fmtTJS(money.stockRetailValue)}
            valueClassName="font-mono font-semibold text-foreground"
            to={to(Action.PRODUCTS_VIEW, '/products')}
            state={filterState}
          />
          {(money.outOfStock > 0 || money.lowStock > 0) && (
            <ListRow
              leading={<PackageX className="text-warning size-5" />}
              title={t('money.runningOut')}
              subtitle={t('money.runningOutDetail', { out: money.outOfStock, low: money.lowStock })}
              value={fmtNum(money.outOfStock + money.lowStock)}
              to={to(Action.PRODUCTS_VIEW, '/products')}
              state={filterState}
            />
          )}
        </ListGroup>
      )}

      <ListGroup title={t('sections.about')}>
        <ListRow
          leading={<Phone className="text-primary size-5" />}
          title={t('fields.phone')}
          value={market.phone ?? notSet}
        />
        <ListRow
          leading={<Clock className="text-primary size-5" />}
          title={t('fields.workHours')}
          // Часы работы — текст свободной длины: под подписью он занимает всю ширину, а не ломает строку.
          subtitle={market.workHours ? <span className="whitespace-pre-line">{market.workHours}</span> : undefined}
          value={market.workHours ? undefined : notSet}
        />
        <ListRow
          leading={
            <EntityAvatar
              name={market.owner.name}
              image={market.owner.image}
              size="sm"
              className="-ml-0.5 size-6 text-[10px]"
            />
          }
          title={t('fields.owner')}
          value={market.owner.name}
          to={ownerTo}
          state={ownerIsMe ? undefined : listState}
        />
        <ListRow title={t('fields.createdAt')} value={formatDate(market.createdAt)} />
      </ListGroup>

      <ListGroup title={t('sections.team')}>
        {market.users.length === 0 ? (
          <ListEmpty>{t('noEmployees')}</ListEmpty>
        ) : (
          market.users.map((member) => {
            const isSeller = member.role === Role.Seller;
            const memberTo =
              member.id === viewer?.id
                ? '/profile'
                : isSeller
                  ? to(Action.SELLERS_VIEW, `/sellers/${member.id}`)
                  : to(Action.USERS_VIEW, `/users/${member.id}`);
            return (
              <ListRow
                key={member.id}
                leading={<EntityAvatar name={member.name} image={member.image} size="md" className="size-10" />}
                title={member.name}
                subtitle={member.phone || member.email}
                value={
                  <Badge variant="secondary" className="text-xs font-normal">
                    {t(`role.${member.role.toLowerCase()}`)}
                  </Badge>
                }
                to={memberTo}
                state={listState}
              />
            );
          })
        )}
      </ListGroup>

      {canSettings ? (
        <ListGroup title={t('sections.settings')} footer={t('settings.sellerSalesHint')}>
          <ListRow
            leading={<ShoppingCart className="text-primary size-5" />}
            title={t('settings.sellerSales')}
            subtitle={allowSales ? t('settings.sellerSalesOn') : t('settings.sellerSalesOff')}
            trailing={
              <Switch
                size="ios"
                checked={allowSales}
                disabled={settings.isPending}
                onCheckedChange={onToggle}
                aria-label={t('settings.sellerSales')}
              />
            }
          />
        </ListGroup>
      ) : (
        <ListGroup title={t('sections.rules')} footer={t('rules.footer')}>
          <ListRow
            leading={<ShoppingCart className="text-primary size-5" />}
            title={t('rules.canRecord')}
            value={allowSales ? t('rules.debtsAndSales') : t('rules.debtsOnly')}
          />
        </ListGroup>
      )}

      {can(Action.MARKETS_DELETE) && (
        <ListGroup>
          <ListRow
            leading={<Trash2 className="size-5" />}
            title={t('actions.delete', { ns: 'common' })}
            destructive
            onClick={requestDelete}
          />
        </ListGroup>
      )}

      <ConfirmDialog
        open={confirmEnable}
        onOpenChange={setConfirmEnable}
        type="warning"
        title={t('settings.enableConfirmTitle')}
        description={t('settings.enableConfirmDescription')}
        confirmText={t('settings.enableConfirm')}
        cancelText={t('actions.cancel', { ns: 'common' })}
        onConfirm={() => {
          setConfirmEnable(false);
          settings.mutate(true);
        }}
      />
      <ConfirmDialog {...deleteDialog} />
    </div>
  );
}
