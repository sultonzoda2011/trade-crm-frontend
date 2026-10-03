import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '~/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground bg-input focus-visible:ring-ring/40 aria-invalid:ring-destructive/40 aria-invalid:bg-destructive/5 h-12 w-full min-w-0 rounded-[10px] border-0 px-3.5 py-1 text-base md:h-10 md:px-3 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Input };
