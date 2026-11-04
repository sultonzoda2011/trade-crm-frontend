import { ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { type Crumb, type Trail, useTrail } from '~/hooks/useCrumbs';

/**
 * «Назад» к родителю. Пришли по ссылке с родителя — возвращаемся по истории (не плодим записи).
 * Зашли по прямой ссылке или с другой страницы — открываем родителя вместо истории.
 */
export function useBackTo(parent: Crumb | null | undefined) {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    if (!parent?.link) return;
    if (parent.fromHistory && location.key !== 'default') navigate(-1);
    else navigate(parent.link, { replace: true });
  };
}

const backClass =
  'glass-control text-primary -ml-1 inline-flex max-w-[75vw] min-h-11 items-center gap-0.5 rounded-full py-1 pr-4 pl-2 text-base font-medium transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none active:scale-[0.97] active:opacity-70 sm:hidden';

const BreadCrumbs = ({ trail }: { trail: Trail }) => {
  const items = useTrail(trail);
  const parent = items.length >= 2 ? items[items.length - 2] : null;
  const goBack = useBackTo(parent);

  return (
    <nav aria-label="Breadcrumb">
      {/* Mobile: кнопка «назад» к родителю. На корневой странице родителя нет — кнопки тоже нет. */}
      {parent?.link && (
        <button type="button" onClick={goBack} className={backClass}>
          <ChevronLeft className="size-6 shrink-0" />
          <span className="truncate">{parent.label}</span>
        </button>
      )}

      {/* Desktop: full breadcrumb trail */}
      <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
        {items.map((element, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={`${index}-${element.label}`} className="flex items-center gap-2">
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
