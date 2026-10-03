import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

const ENTITIES = ['users', 'markets', 'sellers', 'products', 'categories', 'debtors', 'transactions'];

/** Путь → ключ описания в common.json (pageNotes.*). */
function noteKey(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const [first, second, third] = parts;
  if (!first) return null;
  if (first === 'dashboard') {
    const map: Record<string, string> = {
      products: 'dashboardProducts',
      inventory: 'dashboardInventory',
      'sellers-report': 'dashboardSellers',
    };
    return map[second ?? ''] ?? 'dashboard';
  }
  if (first === 'profile' || first === 'guide') return first;
  if (!ENTITIES.includes(first)) return null;
  if (!second) return `${first}List`;
  if (second === 'create') return `${first}Create`;
  if (third === 'edit') return `${first}Edit`;
  return `${first}Detail`;
}

/** Описание страницы внизу — коротко: для чего экран и что на нём можно сделать. */
export function PageNote() {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const key = noteKey(pathname);
  if (!key) return null;
  const text = t(`pageNotes.${key}`, { defaultValue: '' });
  if (!text) return null;
  return (
    <p className="text-muted-foreground mx-auto mt-8 flex max-w-xl items-start gap-2 px-2 text-xs leading-relaxed">
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
