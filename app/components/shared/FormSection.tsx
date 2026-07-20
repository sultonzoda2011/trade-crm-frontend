import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function FormSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>

      <div className="bg-border/60 h-px" />
      <div className="pt-2">{children}</div>
    </section>
  );
}
