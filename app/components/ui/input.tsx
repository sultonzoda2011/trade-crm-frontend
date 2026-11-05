import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '~/lib/utils';

function Input({ className, type, inputMode, enterKeyHint, autoCapitalize, autoCorrect, spellCheck, onKeyDown, ...props }: React.ComponentProps<'input'>) {
  // Автоматические мобильные настройки под тип ввода
  let resolvedInputMode = inputMode;
  let resolvedEnterKeyHint = enterKeyHint;
  let resolvedAutoCapitalize = autoCapitalize;
  let resolvedAutoCorrect = autoCorrect;
  let resolvedSpellCheck = spellCheck;

  if (type === 'number') {
    resolvedInputMode = resolvedInputMode ?? 'decimal';
  } else if (type === 'tel') {
    resolvedInputMode = resolvedInputMode ?? 'tel';
  } else if (type === 'email') {
    resolvedInputMode = resolvedInputMode ?? 'email';
    resolvedAutoCapitalize = resolvedAutoCapitalize ?? 'none';
    resolvedAutoCorrect = resolvedAutoCorrect ?? 'off';
    resolvedSpellCheck = resolvedSpellCheck ?? false;
  } else if (type === 'password') {
    resolvedAutoCapitalize = resolvedAutoCapitalize ?? 'none';
    resolvedAutoCorrect = resolvedAutoCorrect ?? 'off';
    resolvedSpellCheck = resolvedSpellCheck ?? false;
  } else if (type === 'search') {
    resolvedInputMode = resolvedInputMode ?? 'search';
    resolvedEnterKeyHint = resolvedEnterKeyHint ?? 'search';
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    // Внутри формы нажатие Enter на промежуточных полях переносит фокус на следующее поле
    if (e.key === 'Enter' && type !== 'submit' && type !== 'button' && type !== 'search') {
      const form = e.currentTarget.form;
      if (form) {
        const elements = Array.from(
          form.querySelectorAll<HTMLElement>(
            'input:not([type=hidden]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
          )
        );
        const currentIndex = elements.indexOf(e.currentTarget);
        if (currentIndex !== -1 && currentIndex < elements.length - 1) {
          e.preventDefault();
          const next = elements[currentIndex + 1];
          next.focus();
        }
      }
    }
  };

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      inputMode={resolvedInputMode}
      enterKeyHint={resolvedEnterKeyHint}
      autoCapitalize={resolvedAutoCapitalize}
      autoCorrect={resolvedAutoCorrect}
      spellCheck={resolvedSpellCheck}
      onKeyDown={handleKeyDown}
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground bg-input focus-visible:ring-ring/40 aria-invalid:ring-destructive/40 aria-invalid:bg-destructive/5 h-12 w-full min-w-0 rounded-[10px] border-0 px-3.5 py-1 text-base md:h-10 md:px-3 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Input };
