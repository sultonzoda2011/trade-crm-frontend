import type { ReactNode } from 'react';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

interface FormFieldWrapperProps {
  htmlFor?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  children: ReactNode;
}

/**
 * Единая обёртка для полей формы: подпись с маркером обязательности, контрол и текст ошибки.
 */
export function FormFieldWrapper({
  htmlFor,
  label,
  required,
  error,
  className,
  labelClassName,
  errorClassName,
  children,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} className={labelClassName}>
          {label}
          {required && <span className="text-muted-foreground ml-0.5">*</span>}
        </Label>
      )}
      {children}
      {error && <p className={cn('text-destructive text-sm', errorClassName)}>{error}</p>}
    </div>
  );
}
