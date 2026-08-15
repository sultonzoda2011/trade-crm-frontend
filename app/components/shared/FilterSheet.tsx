import { Filter } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveFilter, FilterConfig } from '~/types/filters';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Separator } from '~/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import { FilterField } from '~/components/shared/FilterField';

interface FilterSheetProps {
  config: FilterConfig[];
  filters: ActiveFilter[];
  onApply: (filters: ActiveFilter[]) => void;
  onReset: () => void;
}

type SheetOpenChangeDetails = {
  reason: string;
  event: Event;
  cancel: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * flatpickr portals its calendar to `<body>`, outside the Sheet's DOM subtree.
 * base-ui's non-modal Dialog closes both on `outside-press` (clicking the
 * calendar) and on `focus-out` (focus moving into the calendar). Treat either
 * as "inside" while a flatpickr calendar is involved so the sheet stays open.
 */
function isFlatpickrInteraction(event?: Event): boolean {
  if (typeof document !== 'undefined' && document.querySelector('.flatpickr-calendar.open')) {
    return true;
  }
  const nodes = [event?.target, (event as FocusEvent | undefined)?.relatedTarget];
  return nodes.some((n) => n instanceof Element && n.closest('.flatpickr-calendar'));
}

function setValue(filters: ActiveFilter[], key: string, value: any): ActiveFilter[] {
  const isEmpty = value === '' || value == null;
  if (isEmpty) return filters.filter((f) => f.key !== key);
  const exists = filters.some((f) => f.key === key);
  return exists ? filters.map((f) => (f.key === key ? { key, value } : f)) : [...filters, { key, value }];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterSheet({ config, filters, onApply, onReset }: FilterSheetProps) {
  const { t } = useTranslation('common');
  const [draft, setDraft] = useState<ActiveFilter[]>(filters);
  const [open, setOpen] = useState(false);

  const activeCount = filters.length;

  const handleOpen = (isOpen: boolean, eventDetails?: SheetOpenChangeDetails) => {
    if (
      !isOpen &&
      (eventDetails?.reason === 'outside-press' || eventDetails?.reason === 'focus-out') &&
      isFlatpickrInteraction(eventDetails?.event)
    ) {
      eventDetails.cancel();
      return;
    }

    if (isOpen) setDraft(filters);
    setOpen(isOpen);
  };

  const handleApply = () => {
    onApply(draft);
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setDraft([]);
    setOpen(false);
  };

  const setDraftValue = (key: string, value: any) => {
    setDraft((prev) => setValue(prev, key, value));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen} modal={false}>
      <SheetTrigger
        render={
          <Button variant="outline" className="relative gap-2">
            <Filter className="h-4 w-4" />
            {t('filters.title')}
            {activeCount > 0 && <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px]">{activeCount}</Badge>}
          </Button>
        }
      />

      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-sm">
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">
            {t('filters.title')}
            {activeCount > 0 && (
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                {activeCount} {t('filters.active')}
              </span>
            )}
          </SheetTitle>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-warning hover:bg-warning/15">
              {t('filters.reset')}
            </Button>
          )}
        </SheetHeader>

        {/* Body */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 p-4">
            {config.map((field, i) => (
              <FilterField key={i} field={field} draft={draft} onChange={setDraftValue} />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <SheetFooter className="flex-row gap-2 p-4">
          <SheetClose render={<Button variant="outline" className="flex-1" />}>{t('filters.close')}</SheetClose>
          <Button className="flex-1" onClick={handleApply}>
            {t('filters.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
