import * as React from 'react';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';

import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { XIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useSwipeToDismiss } from '~/hooks/useSwipeToDismiss';

// Motion wraps the Base UI popup so the bottom sheet can be dragged; enter/exit stay CSS.
// Typed loosely on purpose: the popup's native `onDrag*` (HTML drag-and-drop) and Motion's
// `onDrag*` (pan gestures) share names with incompatible signatures.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionPopup = motion.create(SheetPrimitive.Popup) as unknown as React.ComponentType<Record<string, any>>;

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0',
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const { setPopup, overlayRef, motionProps } = useSwipeToDismiss({
    enabled: side === 'bottom',
    onDismiss: () => closeRef.current?.click(),
  });

  return (
    <SheetPortal>
      <SheetOverlay ref={overlayRef as React.Ref<HTMLDivElement>} />
      <MotionPopup
        ref={setPopup as React.Ref<HTMLDivElement>}
        data-slot="sheet-content"
        data-side={side}
        {...motionProps}
        className={cn(
          'bg-popover text-popover-foreground fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:rounded-t-[20px] data-[side=bottom]:pb-[env(safe-area-inset-bottom)] data-[side=bottom]:duration-300 data-[side=bottom]:ease-[cubic-bezier(0.32,0.72,0,1)] data-[side=bottom]:data-ending-style:translate-y-full data-[side=bottom]:data-starting-style:translate-y-full data-[side=bottom]:data-ending-style:opacity-100 data-[side=bottom]:data-starting-style:opacity-100 data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:rounded-r-2xl data-[side=left]:border-r data-[side=left]:pt-[env(safe-area-inset-top)] data-[side=left]:pb-[env(safe-area-inset-bottom)] data-[side=left]:data-ending-style:-translate-x-10 data-[side=left]:data-starting-style:-translate-x-10 data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:rounded-l-2xl data-[side=right]:border-l data-[side=right]:pt-[env(safe-area-inset-top)] data-[side=right]:pb-[env(safe-area-inset-bottom)] data-[side=right]:data-ending-style:translate-x-10 data-[side=right]:data-starting-style:translate-x-10 data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:pt-[env(safe-area-inset-top)] data-[side=top]:data-ending-style:-translate-y-10 data-[side=top]:data-starting-style:-translate-y-10 data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm',
          className
        )}
        {...props}>
        {/* Ручка-«грабер» как у нативных iOS-шторок — только у нижней. */}
        {side === 'bottom' && (
          <>
            {/* Зона захвата шире самой ручки — в неё попадает палец, а не пиксель. */}
            <div data-sheet-drag aria-hidden className="mx-auto -mb-4 flex w-full shrink-0 touch-none justify-center pt-2.5 pb-2.5">
              <div className="bg-muted-foreground/25 h-1.5 w-10 rounded-full" />
            </div>
            <SheetPrimitive.Close ref={closeRef} tabIndex={-1} aria-hidden className="sr-only" />
          </>
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={<Button variant="ghost" className="absolute top-3 right-3" size="icon-sm" />}>
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </MotionPopup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  // В нижней шторке заголовок — тоже зона перетаскивания (см. useSwipeToDismiss).
  return (
    <div
      data-slot="sheet-header"
      data-sheet-drag
      className={cn('in-data-[side=bottom]:touch-none flex flex-col gap-0.5 p-4', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-footer" className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />;
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('font-heading text-foreground text-base font-medium', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
