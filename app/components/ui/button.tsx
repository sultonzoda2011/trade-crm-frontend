import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding text-base font-semibold whitespace-nowrap transition-[opacity,background-color,color] outline-none select-none in-data-[slot=button-group]:rounded-lg focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:ring-3 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 md:text-sm md:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Filled — главное действие экрана.
        default: "bg-primary text-primary-foreground",
        // Tinted — второе по важности действие рядом с главным.
        secondary: "bg-primary/12 text-primary",
        // Серая заливка — нейтральные действия (фильтры, вспомогательные).
        outline: "bg-muted text-foreground aria-expanded:bg-muted/80",
        ghost: "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive: "bg-destructive/12 text-destructive",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Тап-таргет ≥44px: default 48 на телефоне (44 — минимум по HIG, но
      // работают на ходу и в перчатках), lg 52 — главная кнопка на всю ширину.
      size: {
        default: "h-12 gap-2 px-4 md:h-10 md:px-3.5",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-sm font-medium md:text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-10 gap-1.5 rounded-[10px] px-3.5 text-sm font-medium md:h-8 md:px-3 md:text-xs [&_svg:not([class*='size-'])]:size-4",
        lg: "h-[52px] gap-2 px-5 text-[1.0625rem] md:h-11 md:text-base",
        icon: "size-11 md:size-10",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-[10px] md:size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  disabled,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // When rendering as a non-native element (e.g. `render={<Link />}`), Base UI does
  // not emit a `disabled` attribute, so Tailwind's `disabled:` styles never apply.
  // Mirror them here so anchor/Link-rendered buttons look and behave disabled too.
  const nonNative = (nativeButton ?? (render === undefined)) === false;
  const nonNativeDisabled = nonNative && !!disabled;
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), nonNativeDisabled && 'pointer-events-none opacity-50')}
      render={render}
      nativeButton={nativeButton ?? (render === undefined)}
      disabled={disabled}
      {...props}
    />
  )
}

export { Button, buttonVariants }
