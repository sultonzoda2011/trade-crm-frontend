import { PanelsTopLeft, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { PageHeader } from '~/components/layout/PageHeader';
import { EmptyState } from '~/components/shared/EmptyState';
import { Markdown, markdownToPlainText, type CalloutType } from '~/components/shared/Markdown';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { useCan } from '~/hooks/useCan';
import { fallbackLng, supportedLngs, type SupportedLng } from '~/lib/i18n';
import { cn } from '~/lib/utils';
import { getSectionBody } from './content-loader';
import { GUIDE_SECTIONS } from './sections';

/** Считает число непересекающихся вхождений подстроки. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  let idx: number;
  while ((idx = haystack.indexOf(needle, from)) !== -1) {
    count++;
    from = idx + needle.length;
  }
  return count;
}

function normalizeLng(lng: string | undefined): SupportedLng {
  const base = (lng ?? fallbackLng).split('-')[0];
  return (supportedLngs as readonly string[]).includes(base) ? (base as SupportedLng) : fallbackLng;
}

export default function GuidePage() {
  // useSuspense:false — не подвешиваем переход на страницу, пока подгружается
  // namespace `guide`. С включённым Suspense (по умолчанию) и без Suspense-
  // границы вокруг Outlet добавление нового namespace вешало навигацию на
  // /guide в уже проинициализированной сессии. Хук сам догрузит namespace и
  // перерисуется; до этого t() вернёт ключи (мигание вместо зависания).
  const { t, i18n } = useTranslation(['guide', 'common'], { useSuspense: false });
  const { role } = useCan();
  const [params, setParams] = useSearchParams();
  const [rawQuery, setRawQuery] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const lng = normalizeLng(i18n.resolvedLanguage ?? i18n.language);

  // Разделы, доступные текущей роли, с уже загруженным телом и «плоским»
  // текстом для поиска. Пересобираем только при смене роли, языка или перевода.
  const sections = useMemo(() => {
    return GUIDE_SECTIONS.filter(
      (s) => !s.roles || s.roles.length === 0 || (role != null && s.roles.includes(role))
    ).map((s) => {
      const body = getSectionBody(s.id, lng);
      return {
        id: s.id,
        icon: s.icon,
        body,
        title: t(`sections.${s.id}.title`),
        summary: t(`sections.${s.id}.summary`),
        plain: markdownToPlainText(body).toLowerCase(),
      };
    });
  }, [role, lng, t]);

  const query = rawQuery.trim().toLowerCase();
  const searching = query.length >= 2;

  // Количество совпадений по каждому разделу (в заголовке + теле).
  const matchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!searching) return counts;
    for (const s of sections) {
      counts[s.id] = countOccurrences(s.plain, query) + countOccurrences(s.title.toLowerCase(), query);
    }
    return counts;
  }, [sections, query, searching]);

  const totalMatches = useMemo(
    () => Object.values(matchCounts).reduce((sum, n) => sum + n, 0),
    [matchCounts]
  );

  const sectionParam = params.get('section');

  // Какой раздел показать. При поиске приоритет у разделов с совпадениями.
  const activeId = useMemo(() => {
    const ids = sections.map((s) => s.id);
    const fallback = sectionParam && ids.includes(sectionParam) ? sectionParam : (ids[0] ?? '');
    if (!searching) return fallback;
    const matching = sections.filter((s) => (matchCounts[s.id] ?? 0) > 0).map((s) => s.id);
    if (sectionParam && matching.includes(sectionParam)) return sectionParam;
    return matching[0] ?? fallback;
  }, [sections, searching, matchCounts, sectionParam]);

  const active = sections.find((s) => s.id === activeId);

  const selectSection = (id: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('section', id);
        return next;
      },
      { replace: true }
    );
    setMobileTocOpen(false);
  };

  const calloutLabels: Partial<Record<CalloutType, string>> = {
    tip: t('callout.tip'),
    note: t('callout.note'),
    important: t('callout.important'),
    warning: t('callout.warning'),
  };

  const noSearchResults = searching && totalMatches === 0;

  const toc = (
    <nav className="space-y-1">
      <p className="text-muted-foreground px-2 pb-1 text-xs font-medium tracking-wide uppercase">
        {t('tocTitle')}
      </p>
      {sections.map((s) => {
        const Icon = s.icon;
        const count = matchCounts[s.id] ?? 0;
        const isActive = s.id === activeId;
        const dimmed = searching && count === 0;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => selectSection(s.id)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground',
              dimmed && !isActive && 'opacity-45'
            )}>
            <Icon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{s.title}</span>
            {searching && count > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex-1">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Поиск — «липкий» вверху рабочей области */}
      <div className="bg-background/95 border-border/60 sticky top-0 z-20 -mx-3 mt-4 border-b px-3 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="h-10 pr-9 pl-9 text-sm"
          />
          {rawQuery && (
            <button
              type="button"
              onClick={() => setRawQuery('')}
              aria-label={t('clearSearch')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md">
              <X className="size-4" />
            </button>
          )}
        </div>
        {searching && (
          <p className="text-muted-foreground mt-2 text-xs">
            {totalMatches > 0
              ? t('matchesCount', { count: totalMatches })
              : t('noResults', { query: rawQuery.trim() })}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-6">
        {/* Оглавление — desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">{toc}</div>
        </aside>

        {/* Контент */}
        <div className="min-w-0 flex-1">
          {/* Кнопка «Содержание» — mobile */}
          <div className="mb-4 lg:hidden">
            <Sheet open={mobileTocOpen} onOpenChange={setMobileTocOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2">
                    <PanelsTopLeft className="size-4" data-icon="inline-start" />
                    {t('tocTitle')}
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-border/60 border-b">
                  <SheetTitle>{t('tocTitle')}</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto p-3">{toc}</div>
              </SheetContent>
            </Sheet>
          </div>

          {noSearchResults ? (
            <EmptyState message={t('noResults', { query: rawQuery.trim() })} className="py-20" />
          ) : active ? (
            <article className="max-w-3xl">
              <Markdown source={active.body} highlight={query} calloutLabels={calloutLabels} />
            </article>
          ) : (
            <EmptyState message={t('emptyDescription')} className="py-20" />
          )}
        </div>
      </div>
    </div>
  );
}
