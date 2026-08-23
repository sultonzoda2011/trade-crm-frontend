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
  className?: string;
}

export function EntityCard({
  title,
  fullName,
  subInfo,
  imagePath,
  viewTo,
  viewLabel,
  viewState,
  className,
}: EntityCardProps) {
  return (
    <Panel title={title} className={className}>
      <div className="space-y-4">
        <UserAvatar fullName={fullName} subInfo={subInfo} imagePath={imagePath} />
        <Button
          variant="outline"
          className="h-9 w-full justify-between gap-2"
          size="sm"
          render={<Link to={viewTo} state={viewState} />}>
          <span className="truncate">{viewLabel}</span>
          <ArrowUpRight className="size-3.5 shrink-0" />
        </Button>
      </div>
    </Panel>
  );
}
