import type { LucideIcon } from 'lucide-react';
import { BookOpen, HandCoins, LayoutDashboard, Package, Receipt, Settings, Store, Users } from 'lucide-react';
import type { Role } from '~/types/common';

/**
 * Реестр разделов справочника. Порядок в массиве = порядок в оглавлении.
 *
 * Текст каждого раздела лежит в markdown-файле content/{lng}/{id}.md,
 * а заголовок/описание — в i18n-namespace `guide` по ключам
 * `sections.{id}.title` и `sections.{id}.summary`.
 *
 * Чтобы добавить раздел: добавьте элемент сюда, положите три md-файла
 * (ru/en/tg) и три пары ключей title/summary в guide.json каждой локали.
 */
export interface GuideSection {
  /** Совпадает с именем md-файла: content/{lng}/{id}.md */
  id: string;
  /** Иконка в оглавлении */
  icon: LucideIcon;
  /** Если задано — раздел виден только этим ролям. Пусто = всем ролям. */
  roles?: Role[];
}

export const GUIDE_SECTIONS: GuideSection[] = [
  { id: 'basics', icon: BookOpen },
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'transactions', icon: Receipt },
  { id: 'debtors', icon: HandCoins },
  { id: 'products', icon: Package },
  { id: 'markets', icon: Store },
  { id: 'people', icon: Users },
  { id: 'profile', icon: Settings },
];
