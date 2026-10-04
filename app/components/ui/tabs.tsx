'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '~/lib/utils';

function Tabs({ ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('bg-muted flex items-center justify-start gap-0.5 overflow-x-auto rounded-[10px] p-0.5', className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'data-active:bg-card dark:data-active:bg-white/20 data-active:text-foreground data-active:shadow-sm focus-visible:ring-ring text-muted-foreground hover:text-foreground inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        'data-starting-style:animate-in data-starting-style:fade-in-0 data-ending-style:animate-out data-ending-style:fade-out-0 outline-none',
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
