import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'danger';

const TONE: Record<Tone, string> = {
  default: '',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

export interface HeroStat {
  label: string;
  value: ReactNode;
  tone?: Tone;
  /** Показатель — вход в список (число товаров → список товаров): ячейка становится ссылкой. */
  to?: string;
  state?: unknown;
}

interface DetailHeroProps {
  avatar: ReactNode;
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  /** Куда ведёт «Изменить». Не передавайте, если у роли нет права — кнопка просто не появится. */
  editTo?: string;
  editLabel?: string;
  /** Главная цифра страницы: долг должника, сумма сделки. */
  figure?: { label: string; value: ReactNode; tone?: Tone; caption?: ReactNode };
  /** 2–4 коротких показателя в ряд под шапкой. */
  stats?: HeroStat[];
  /** Главные действия — кнопки на всю ширину. */
  actions?: ReactNode;
}

/**
 * Шапка страницы «по id»: аватар, имя, значки, главная цифра, показатели и
 * главные действия — в одной карточке.
 *
 * «Изменить» — стеклянная круглая кнопка в углу, а не строка в списке
 * действий: правка относится к самой записи, и в этом углу её ищет рука.
 * Мягкий цветной отсвет за углом нужен стеклу — на сплошном фоне оно не видно.
 */
export function DetailHero({
  avatar,
  title,
  subtitle,
  badges,
  editTo,
  editLabel,
  figure,
  stats,
  actions,
}: DetailHeroProps) {
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
        {editTo ? (
          <Button variant="glass" size="icon" aria-label={editLabel} render={<Link to={editTo} />}>
            <Pencil className="size-4" strokeWidth={1.75} />
          </Button>
        ) : null}
      </div>

      {figure ? (
        <div className="relative mt-4 border-t pt-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{figure.label}</p>
          <p
            className={cn(
              'mt-1 font-mono text-4xl leading-none font-bold tracking-tight tabular-nums',
              TONE[figure.tone ?? 'default']
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
                    TONE[stat.tone ?? 'default']
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
    </section>
  );
}
