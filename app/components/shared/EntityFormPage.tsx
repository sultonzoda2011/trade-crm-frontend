import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import BreadCrumbs from '~/components/ui/bread-crumb';
import { Button } from '~/components/ui/button';

interface EntityFormPageProps {
  /** `id` of the `<form>`, so the header and sticky-bar buttons can submit it. */
  formId: string;
  title: string;
  breadcrumbs: { label: string; link?: string }[];
  /** Where Cancel and the failed-submit escape hatch lead. */
  cancelTo: string;
  submitLabel: string;
  isPending: boolean;
  /** Beyond the in-flight guard — e.g. a form that is still untouched. */
  submitDisabled?: boolean;
  onFormSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  /**
   * A `<FormFileInput>` element for this entity's picture. It arrives as a bare
   * element because only the page knows its control/name; the `Panel` wrapper
   * and the two-column grid around it are the part that was repeated.
   */
  imageField?: ReactNode;
  children: ReactNode;
}

function SubmitButton({
  formId,
  isPending,
  submitDisabled,
  submitLabel,
  className,
  size,
}: {
  formId: string;
  isPending: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  className?: string;
  size?: 'lg';
}) {
  return (
    <Button type="submit" form={formId} size={size} loading={isPending} disabled={submitDisabled} className={className}>
      {submitLabel}
    </Button>
  );
}

/**
 * The frame around every full-page form: breadcrumb trail, title with the
 * desktop cancel/submit pair, the optional picture panel, the form body, and
 * the sticky mobile action bar.
 *
 * Each of the thirteen form pages carried its own copy of the same three
 * blocks — the ~13-line mobile action bar in particular was byte-identical
 * everywhere, including the `env(safe-area-inset-bottom)` padding that must not
 * be forgotten on a new page.
 */
export function EntityFormPage({
  formId,
  title,
  breadcrumbs,
  cancelTo,
  submitLabel,
  isPending,
  submitDisabled,
  onFormSubmit,
  imageField,
  children,
}: EntityFormPageProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const form = <form id={formId} onSubmit={onFormSubmit} className="space-y-4">{children}</form>;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col space-y-5 pb-32 md:max-w-none md:pb-8">
      <BreadCrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="hidden gap-3 md:flex">
          <Button variant="outline" onClick={() => navigate(cancelTo)}>
            {t('actions.cancel')}
          </Button>
          <SubmitButton
            formId={formId}
            isPending={isPending}
            submitDisabled={submitDisabled}
            submitLabel={submitLabel}
          />
        </div>
      </div>

      {imageField ? (
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[3.5fr_6.5fr] md:gap-6">
          <Panel>{imageField}</Panel>
          <Panel bodyClassName="p-4 md:p-6">{form}</Panel>
        </div>
      ) : (
        <Panel bodyClassName="p-4 md:p-6">{form}</Panel>
      )}

      {/*
       * Нижняя панель на телефоне: вкладки на экранах форм скрыты, поэтому она
       * стоит у самого низа. Одна кнопка на всю ширину — «Отмена» не нужна, есть
       * «назад» сверху (как у push-экрана в iOS).
       */}
      <div
        className="bg-card border-border fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 md:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <SubmitButton
          formId={formId}
          isPending={isPending}
          submitDisabled={submitDisabled}
          submitLabel={submitLabel}
          size="lg"
          className="w-full"
        />
      </div>
    </div>
  );
}
