import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { METRIC_TONE_CLASS, type MetricTone } from '~/config/tones';
import { cn } from '~/lib/utils';

export interface HeroStat {
  label: string;
  value: ReactNode;
  tone?: MetricTone;
  /** Показатель — вход в список (число товаров → список товаров): ячейка становится ссылкой. */
  to?: string;
  state?: unknown;
}

/**
 * Управление самой записью: изменить и удалить. Передавайте только
 * то, что разрешено роли и бэкенду, — остальные кнопки просто не появятся.
 */
export interface HeroManage {
  editTo?: string;
  onDelete?: () => void;
}

interface DetailHeroProps {
  avatar: ReactNode;
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  /** Главная цифра страницы: долг должника, сумма сделки. */
  figure?: { label: string; value: ReactNode; tone?: MetricTone; caption?: ReactNode };
  /** 2–4 коротких показателя в ряд под шапкой. */
  stats?: HeroStat[];
  /** Главные действия — кнопки на всю ширину. */
  actions?: ReactNode;
  /** Изменить / удалить — одним рядом под главными действиями. */
  manage?: HeroManage;
}

/**
 * Шапка страницы «по id»: аватар, имя, значки, главная цифра, показатели и
 * главные действия — в одной карточке.
 *
 * Изменить, копия и удаление — отдельный ряд внизу карточки (`manage`): они
 * относятся к самой записи, а не к её содержимому, поэтому не смешиваются с
 * главными действиями страницы. Мягкий цветной отсвет в углу — фон шапки.
 */
export function DetailHero({ avatar, title, subtitle, badges, figure, stats, actions, manage }: DetailHeroProps) {
  const { t } = useTranslation('common');
  const hasManage = !!manage && !!(manage.editTo || manage.onDelete);

  return (
    <section className="bg-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 62%)',
        }}
      />

      <div className="relative flex items-start gap-4">
        {avatar}
        <div className={cn('min-w-0 flex-1 space-y-1.5', !subtitle && !badges && 'self-center')}>
          <h1 className="text-xl leading-tight font-bold tracking-tight break-words sm:text-2xl">{title}</h1>
          {subtitle ? <div className="text-muted-foreground text-sm leading-snug break-words">{subtitle}</div> : null}
          {badges ? <div className="flex flex-wrap items-center gap-1.5 pt-0.5">{badges}</div> : null}
        </div>
      </div>

      {figure ? (
        <div className="relative mt-4 border-t pt-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{figure.label}</p>
          <p
            className={cn(
              'mt-1 font-mono text-4xl leading-none font-bold tracking-tight tabular-nums',
              METRIC_TONE_CLASS[figure.tone ?? 'default']
            )}>
            {figure.value}
          </p>
          {figure.caption ? <p className="text-muted-foreground mt-1.5 text-sm">{figure.caption}</p> : null}
        </div>
      ) : null}

      {stats && stats.length > 0 ? (
        <dl
          className={cn(
            'divide-border relative mt-4 grid divide-x border-t pt-4',
            stats.length === 2 && 'grid-cols-2',
            stats.length === 3 && 'grid-cols-3',
            stats.length >= 4 && 'grid-cols-2 gap-y-4 sm:grid-cols-4'
          )}>
          {stats.map((stat) => {
            const cell = (
              <>
                <dt className="text-muted-foreground text-xs leading-tight">{stat.label}</dt>
                <dd
                  className={cn(
                    'mt-1 text-base leading-tight font-semibold break-words tabular-nums',
                    METRIC_TONE_CLASS[stat.tone ?? 'default']
                  )}>
                  {stat.value}
                </dd>
              </>
            );
            const classes = 'min-w-0 px-3 first:pl-0 last:pr-0';
            return stat.to ? (
              <Link
                key={stat.label}
                to={stat.to}
                state={stat.state}
                className={cn(classes, 'block transition-opacity active:opacity-60')}>
                {cell}
              </Link>
            ) : (
              <div key={stat.label} className={classes}>
                {cell}
              </div>
            );
          })}
        </dl>
      ) : null}

      {actions ? <div className="relative mt-4 flex flex-col gap-2 sm:flex-row [&>*]:sm:flex-1">{actions}</div> : null}

      {hasManage ? (
        <div
          className={cn(
            'relative flex flex-wrap gap-2 [&>*]:min-w-32 [&>*]:flex-1',
            actions ? 'mt-2' : 'mt-4 border-t pt-4'
          )}>
          {manage.editTo ? (
            <Button variant="secondary" render={<Link to={manage.editTo} />}>
              <Pencil data-icon="inline-start" />
              {t('actions.edit')}
            </Button>
          ) : null}
          {manage.onDelete ? (
            <Button variant="destructive" onClick={manage.onDelete}>
              <Trash2 data-icon="inline-start" />
              {t('actions.delete')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
