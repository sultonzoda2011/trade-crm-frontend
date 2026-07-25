import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { Panel } from '~/components/layout/Panel';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { Modal } from '~/components/shared/Modal';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import type { Category } from '~/types/products';

// Простая страница управления категориями товаров (ADMIN/OWNER) — список +
// создание/переименование/удаление. Доступ на уровне роута контролируется
// бэкендом (@Roles(ADMIN, OWNER) на CategoriesController), а на фронте — тем,
// что ссылка на страницу показывается только этим ролям в сайдбаре.
export default function CategoriesPage() {
  const { t } = useTranslation(['products', 'common']);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const categories = data?.data ?? [];

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => categoriesApi.create({ name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('createSuccess'));
      setCreateOpen(false);
      setName('');
    },
    onError: () => toast.error(t('createError')),
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: () => categoriesApi.update({ id: editing!.id, request: { name } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('updateSuccess'));
      setEditing(null);
      setName('');
    },
    onError: () => toast.error(t('updateError')),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('actions.deleteSuccess'));
      setDeletingId(null);
    },
    onError: () => toast.error(t('actions.deleteError')),
  });

  return (
    <div className="flex flex-1 flex-col space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('categories.title', { defaultValue: 'Категории' })}</h1>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('actions.create')}
        </Button>
      </div>

      <Panel className="p-0">
        {isLoading ? (
          <p className="text-muted-foreground p-6 text-center text-sm">{t('common:loading', { defaultValue: '...' })}</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            {t('categories.empty', { defaultValue: 'Категорий пока нет' })}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="font-mono">
                    {category._count.products}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditing(category);
                      setName(category.name);
                    }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 h-8 w-8"
                    onClick={() => setDeletingId(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title={t('categories.create', { defaultValue: 'Новая категория' })}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button disabled={!name || isCreating} onClick={() => create()}>
              {t('actions.create')}
            </Button>
          </div>
        }>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('fields.name')} />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={t('actions.edit')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t('actions.cancel')}
            </Button>
            <Button disabled={!name || isUpdating} onClick={() => update()}>
              {t('actions.save')}
            </Button>
          </div>
        }>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('fields.name')} />
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => remove(deletingId!)}
        isLoading={isDeleting}
        type="danger"
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
