import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

interface BreadCrumbLink {
  label: string;
  link?: string;
}

interface BreadCrumbProps {
  items: BreadCrumbLink[];
}

const BreadCrumbs = ({ items }: BreadCrumbProps) => {
  const backItem = items.length >= 2 ? items[items.length - 2] : null;

  return (
    <nav aria-label="Breadcrumb">
      {/* Mobile: back button */}
      {backItem?.link && (
        <Link
          to={backItem.link}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors sm:hidden"
        >
          <ChevronLeft className="size-4" />
          {backItem.label}
        </Link>
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
