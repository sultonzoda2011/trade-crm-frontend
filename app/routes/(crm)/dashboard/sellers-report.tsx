import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '~/api/dashboard';
import { Panel } from '~/components/layout/Panel';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { fmtTJS } from '~/lib/format';

export default function SellersReportPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sellers-report', dateFrom, dateTo],
    queryFn: () => dashboardApi.getSellersReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <h1 className="text-2xl font-bold">{t('sellersReport')}</h1>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>{t('period.from')}</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('period.to')}</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <Panel className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">{t('empty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground text-xs">
                <th className="px-4 py-3 font-medium">{t('table.seller')}</th>
                <th className="px-4 py-3 font-medium">{t('table.salesCount')}</th>
                <th className="px-4 py-3 font-medium">{t('table.salesAmount')}</th>
                <th className="px-4 py-3 font-medium">{t('table.refundsCount')}</th>
                <th className="px-4 py-3 font-medium">{t('table.debtsAmount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.seller?.id ?? Math.random()}>
                  <td className="px-4 py-3 font-medium">{row.seller?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono">{row.salesCount}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{fmtTJS(row.salesAmount)}</td>
                  <td className="px-4 py-3 font-mono">{row.refundsCount}</td>
                  <td className="px-4 py-3 font-mono text-warning">{fmtTJS(row.debtsAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
