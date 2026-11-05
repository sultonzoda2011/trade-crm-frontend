import { useState, useRef, useCallback, type ReactNode, type TouchEvent } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { haptic } from '~/lib/haptics';
import { getIsOnline } from '~/lib/network-status';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '~/lib/utils';

const PULL_THRESHOLD = 60;
const MAX_PULL = 90;
const RESISTANCE = 0.42;

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, disabled = false, className }: PullToRefreshProps) {
  const { t } = useTranslation('common');
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const isPulling = useRef(false);
  const triggeredHaptic = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getScrollParentTop = useCallback((): number => {
    let el: HTMLElement | null = containerRef.current;
    while (el) {
      if (el.scrollTop > 0) return el.scrollTop;
      el = el.parentElement;
    }
    return window.scrollY || document.documentElement.scrollTop || 0;
  }, []);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    if (getScrollParentTop() > 0) return;

    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    isPulling.current = false;
    triggeredHaptic.current = false;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    if (getScrollParentTop() > 0) {
      if (pullY > 0) setPullY(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startY.current;
    const deltaX = currentX - startX.current;

    // Игнорируем горизонтальные свайпы карточек
    if (!isPulling.current && Math.abs(deltaX) > Math.abs(deltaY)) {
      return;
    }

    if (deltaY > 5) {
      isPulling.current = true;
      const damped = Math.min(deltaY * RESISTANCE, MAX_PULL);
      setPullY(damped);

      if (damped >= PULL_THRESHOLD && !triggeredHaptic.current) {
        haptic('light');
        triggeredHaptic.current = true;
      } else if (damped < PULL_THRESHOLD && triggeredHaptic.current) {
        triggeredHaptic.current = false;
      }
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;
    if (!isPulling.current) return;

    isPulling.current = false;

    if (pullY >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullY(PULL_THRESHOLD);

      if (!getIsOnline()) {
        toast(t('offline.noConnection', { defaultValue: 'Офлайн-режим: отображаются локальные данные' }));
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 400);
        return;
      }

      try {
        await Promise.resolve(onRefresh());
        haptic('selection');
      } catch {
        // Ошибки refetch обрабатываются React Query
      } finally {
        setIsRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  };

  const progress = Math.min(pullY / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn('relative min-h-0 flex-1', className)}>
      {/* iOS-style Pull Indicator */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center transition-all duration-150 ease-out"
        style={{
          transform: `translateY(${pullY > 0 || isRefreshing ? pullY - 36 : -40}px)`,
          opacity: pullY > 10 || isRefreshing ? 1 : 0,
        }}>
        <div className="bg-card/90 text-foreground flex size-9 items-center justify-center rounded-full border shadow-md backdrop-blur-md">
          {isRefreshing ? (
            <Loader2 className="text-primary size-5 animate-spin" />
          ) : (
            <ArrowDown
              className="size-4.5 transition-transform duration-200"
              style={{
                transform: `rotate(${progress >= 1 ? 180 : progress * 180}deg)`,
                opacity: Math.max(0.4, progress),
              }}
            />
          )}
        </div>
      </div>

      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullY > 0 ? `translateY(${pullY * 0.4}px)` : undefined,
        }}>
        {children}
      </div>
    </div>
  );
}
