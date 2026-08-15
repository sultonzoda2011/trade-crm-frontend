import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { Radio as RadioPrimitive } from '@base-ui/react/radio';

import { cn } from '~/lib/utils';

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn('flex flex-col gap-1', className)} {...props} />;
}

function Radio({ className, children, ...props }: RadioPrimitive.Root.Props & { children?: React.ReactNode }) {
  return (
    <label data-slot="radio-label" className="flex cursor-pointer items-center gap-2 text-sm">
      <RadioPrimitive.Root
        data-slot="radio"
        className={cn(
          'border-input focus-visible:border-ring focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-3 data-disabled:cursor-not-allowed data-disabled:opacity-50',
          className
        )}
        {...props}>
        <RadioPrimitive.Indicator
          data-slot="radio-indicator"
          className="bg-primary-foreground size-2 rounded-full data-[checked]:block data-[unchecked]:hidden"
        />
      </RadioPrimitive.Root>
      {children}
    </label>
  );
}

export { RadioGroup, Radio };
