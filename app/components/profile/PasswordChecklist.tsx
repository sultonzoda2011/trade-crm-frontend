import { Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PASSWORD_RULES } from '~/lib/password-rules';
import { cn } from '~/lib/utils';

interface PasswordChecklistProps {
  value: string;
  /** Повтор пароля: показываем пункт «пароли совпадают», когда он уже введён. */
  confirm?: string;
}

/**
 * Живая подсказка под полем нового пароля: что уже выполнено, а чего не хватает.
 * Ошибка «слабый пароль» после отправки — плохая подсказка; здесь человек видит
 * требования заранее и по ходу набора.
 */
export function PasswordChecklist({ value, confirm }: PasswordChecklistProps) {
  const { t } = useTranslation('profile');

  const items = PASSWORD_RULES.map((rule) => ({
    id: rule.id as string,
    label: t(`passwordRules.${rule.id}`),
    ok: rule.test(value),
  }));
  if (confirm !== undefined && confirm !== '') {
    items.push({ id: 'match', label: t('passwordRules.match'), ok: confirm === value && value !== '' });
  }

  return (
    <ul className="space-y-1.5 px-1" aria-label={t('passwordRules.title')}>
      {items.map((item) => (
        <li
          key={item.id}
          data-ok={item.ok}
          className={cn(
            'flex items-center gap-2 text-sm transition-colors',
            item.ok ? 'text-success' : 'text-muted-foreground'
          )}>
          {item.ok ? <Check className="size-4 shrink-0" strokeWidth={2.5} /> : <Circle className="size-4 shrink-0" />}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
