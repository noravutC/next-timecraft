'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

/**
 * segmented: gray track with a raised white option (4h · 1d · 1w)
 * underline: hairline row, active tab gets an ink underline (dialogs, sheets)
 * pill:      rounded chips, active chip is filled ink (notification filters)
 */
type TabsVariant = 'segmented' | 'underline' | 'pill';

const TabsVariantContext = React.createContext<TabsVariant>('segmented');

const LIST_STYLES: Record<TabsVariant, string> = {
  segmented:
    'inline-flex w-fit items-center gap-0.5 rounded-lg bg-surface-hover p-0.5',
  underline: 'flex items-center gap-5 border-b border-line',
  pill: 'flex items-center gap-1',
};

const TRIGGER_STYLES: Record<TabsVariant, string> = {
  segmented:
    'h-7 rounded-md px-3 text-sm font-medium text-ink-subtle hover:text-ink data-[state=active]:bg-background data-[state=active]:text-ink data-[state=active]:shadow-segment',
  underline:
    '-mb-px h-10 border-b-2 border-transparent text-sm font-medium text-ink-subtle hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink',
  pill: 'h-7 rounded-full border border-line bg-background px-2.5 text-xs font-medium text-ink-muted hover:border-line-strong data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-white',
};

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = 'segmented',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: TabsVariant;
}) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(LIST_STYLES[variant], className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ink/10 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        TRIGGER_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
