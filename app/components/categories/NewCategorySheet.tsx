import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { ColorSwatches } from '~/components/categories/ColorSwatches';
import { CustomInput } from '~/components/shared/CustomInput';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { buildMultipart } from '~/lib/form-data';
import { invalidateEntityCache } from '~/lib/query-keys';

export interface CreatedCategory {
  id: string;
  name: string;
}

interface NewCategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: CreatedCategory) => void;
}

/**
 * Быстрое создание категории из формы товара: название и цвет, больше ничего. Фото и
 * описание — позже, на странице категории. Только онлайн (`networkMode: 'always'`, вызывающий
 * не показывает «+ Новая категория» без сети): категория нужна серверу как настоящая запись,
 * товар ссылается на её id, а в офлайн-очередь категории не входят.
 */
export function NewCategorySheet({ open, onOpenChange, onCreated }: NewCategorySheetProps) {
  const { t } = useTranslation(['categories', 'common']);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setColor('');
    }
  }, [open]);

  const create = useMutation({
    networkMode: 'always',
    mutationFn: () => categoriesApi.create(buildMultipart({ name: name.trim(), color })),
    onSuccess: (result) => {
      const created = (result as { data?: { id: string; name: string } } | undefined)?.data;
      invalidateEntityCache(queryClient, 'categories');
      toast.success(t('createSuccess'));
      onOpenChange(false);
      if (created) onCreated({ id: created.id, name: created.name });
    },
    // «Такая категория уже есть» и прочее показывает общий перехватчик запросов.
  });

  const canSubmit = name.trim().length > 0 && !create.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="bg-background gap-0 p-0 md:mx-auto md:max-w-lg">
        <SheetHeader className="px-5 pt-1 pb-2">
          <SheetTitle className="text-center text-lg">{t('create')}</SheetTitle>
        </SheetHeader>
        <form
          className="space-y-4 px-4 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            // Шторка живёт внутри формы товара (React-дерево): без этого отправилась бы и она.
            e.stopPropagation();
            if (canSubmit) create.mutate();
          }}>
          <div className="bg-card space-y-4 rounded-2xl p-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-category-name">{t('fields.name')}</Label>
              <CustomInput
                id="new-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('fields.name')}
                autoComplete="off"
                maxLength={100}
              />
            </div>
            <ColorSwatches value={color} onChange={setColor} label={t('fields.color')} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit} loading={create.isPending}>
            {t('actions.create', { ns: 'common' })}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
