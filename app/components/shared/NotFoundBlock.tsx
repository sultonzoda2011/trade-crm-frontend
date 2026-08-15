import { Button } from '~/components/ui/button';

interface NotFoundBlockProps {
  label: string;
  onBack: () => void;
  backLabel?: string;
}

export function NotFoundBlock({ label, onBack, backLabel }: NotFoundBlockProps) {
  return (
    <div className="flex h-100 flex-col items-center justify-center space-y-4">
      <p className="text-muted-foreground">{label}</p>
      <Button variant="outline" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  );
}
