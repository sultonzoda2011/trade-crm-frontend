import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

interface BreadCrumbLink {
  label: string;
  link?: string;
}

interface BreadCrumbProps {
  items: BreadCrumbLink[];
}

const BreadCrumbs = ({ items }: BreadCrumbProps) => {
  const navigate = useNavigate();
  const backItem = items.length >= 2 ? items[items.length - 2] : null;
  const backClass =
    'text-primary -ml-1 flex min-h-11 items-center gap-0.5 text-base transition-opacity active:opacity-60 sm:hidden';

  return (
    <nav aria-label="Breadcrumb">
      {/* Mobile: back button */}
      {backItem?.link ? (
        <Link to={backItem.link} className={backClass}>
          <ChevronLeft className="size-6" />
          {backItem.label}
        </Link>
      ) : (
        // Зашли по прямой ссылке — родителя в state нет, идём назад по истории.
        <button type="button" onClick={() => navigate(-1)} className={backClass}>
          <ChevronLeft className="size-6" />
          {backItem?.label ?? ''}
        </button>
      )}

      {/* Desktop: full breadcrumb trail */}
      <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
        {items.map((element, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={element.link || element.label} className="flex items-center gap-2">
              {element.link && !isLast ? (
                <Link to={element.link} className="hover:text-foreground transition-colors">
                  {element.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{element.label}</span>
              )}

              {index < items.length - 1 && <span aria-hidden="true">/</span>}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default BreadCrumbs;
