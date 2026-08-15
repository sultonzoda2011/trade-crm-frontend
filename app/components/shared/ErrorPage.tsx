import { FileQuestion, ShieldX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

const ICON_VARIANTS = {
  shield: { Icon: ShieldX, wrapperClass: 'bg-destructive/10', iconClass: 'text-destructive' },
  file: { Icon: FileQuestion, wrapperClass: 'bg-primary/10', iconClass: 'text-primary' },
} as const;

interface ErrorPageProps {
  code: string;
  icon: keyof typeof ICON_VARIANTS;
  titleKey: string;
  descriptionKey: string;
  backHomeKey: string;
  title?: string;
  description?: string;
}

export default function ErrorPage({
  code,
  icon,
  titleKey,
  descriptionKey,
  backHomeKey,
  title: rawTitle,
  description: rawDescription,
}: ErrorPageProps) {
  const { t } = useTranslation('common');
  const { Icon, wrapperClass, iconClass } = ICON_VARIANTS[icon];
  const title = rawTitle ?? t(titleKey);
  const description = rawDescription ?? t(descriptionKey);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl', wrapperClass)}>
        <Icon className={cn('h-8 w-8', iconClass)} />
      </div>
      <div className="space-y-2">
        <p className="text-5xl font-bold tracking-tight">{code}</p>
        <h1 className="text-lg font-semibold">{title}</h1>
        {description && <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>}
      </div>
      <Button render={<Link to="/dashboard" />}>{t(backHomeKey)}</Button>
    </div>
  );
}
