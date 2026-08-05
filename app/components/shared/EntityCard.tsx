import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Panel } from '~/components/layout/Panel';
import { Button } from '~/components/ui/button';
import { UserAvatar } from '~/components/shared/UserAvatar';
import { ArrowUpRight } from 'lucide-react';

interface EntityCardProps {
  title: string;
  fullName: string;
  subInfo?: string;
  imagePath?: string;
  viewTo: string;
  viewLabel: string;
  viewState?: unknown;
}

export function EntityCard({ title, fullName, subInfo, imagePath, viewTo, viewLabel, viewState }: EntityCardProps) {
  return (
<Panel title={title}>
      <div className="space-y-4">
        <UserAvatar fullName={fullName} subInfo={subInfo} imagePath={imagePath} />
        <Button variant="outline" className="w-full" size="sm" render={<Link to={viewTo} state={viewState} />}>
          {viewLabel}
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    </Panel>
  );
}