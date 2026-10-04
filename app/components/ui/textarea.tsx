import * as React from 'react';

import { cn } from '~/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground bg-input focus-visible:ring-ring/40 aria-invalid:ring-destructive/40 aria-invalid:bg-destructive/5 flex field-sizing-content min-h-24 w-full resize-none rounded-[10px] border-0 px-3.5 py-3 text-base transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-sm md:min-h-20 md:px-3 md:py-2',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
