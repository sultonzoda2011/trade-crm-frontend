import type { LucideIcon } from 'lucide-react';
import { animate, motion, useDragControls, useMotionValue, useTransform } from 'motion/react';
import { useCallback, useEffect, useId, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { haptic } from '~/lib/haptics';
import { cn } from '~/lib/utils';

export interface SwipeAction {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: 'primary' | 'destructive';
  onSelect: () => void;
}

const ACTION_WIDTH = 76;
/** Жест не стартует у самого края экрана — там живёт системный жест «назад». */
const EDGE_GUARD = 24;
/** После этого сдвига тап считается частью жеста и не открывает строку. */
const TAP_SLOP = 6;
const LONG_PRESS_MS = 450;
const SNAP = { type: 'spring', stiffness: 520, damping: 42 } as const;
const OPEN_EVENT = 'swipe-row:open';

const TONE_CLASS: Record<SwipeAction['tone'], string> = {
  primary: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-white',
};

interface SwipeableRowProps {
  actions: SwipeAction[];
  children: ReactNode;
  className?: string;
}

/**
 * iOS-строка со свайпом влево: под строкой прячутся кнопки действий. Открыта
 * одновременно только одна строка; пока строка открыта, тап по ней закрывает её,
 * а не уходит по ссылке. Долгое нажатие открывает действия без свайпа — запасной
 * путь для тех, кто жест не нашёл. Вертикальный скролл не блокируется
 * (`touch-action: pan-y` + `dragDirectionLock`).
 */
export function SwipeableRow({ actions, children, className }: SwipeableRowProps) {
  const id = useId();
  const width = actions.length * ACTION_WIDTH;
  const x = useMotionValue(0);
  const controls = useDragControls();
  const openRef = useRef(false);
  const movedRef = useRef(false);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actionsOpacity = useTransform(x, [-width, -12, 0], [1, 0.6, 0]);

  const snapTo = useCallback(
    (open: boolean) => {
      const wasOpen = openRef.current;
      openRef.current = open;
      animate(x, open ? -width : 0, SNAP);
      if (open && !wasOpen) {
        haptic('selection');
        window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
      }
    },
    [id, width, x]
  );

  // Открылась соседняя строка — закрываемся.
  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id && openRef.current) snapTo(false);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      clearTimeout(longPressTimer.current);
    };
  }, [id, snapTo]);

  const clearLongPress = () => clearTimeout(longPressTimer.current);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    movedRef.current = false;
    downRef.current = { x: e.clientX, y: e.clientY };
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      if (!movedRef.current) {
        movedRef.current = true; // последующий отрыв пальца не должен считаться тапом
        snapTo(true);
      }
    }, LONG_PRESS_MS);

    const nearEdge = e.clientX < EDGE_GUARD || e.clientX > window.innerWidth - EDGE_GUARD;
    if (!nearEdge) controls.start(e, { snapToCursor: false });
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = downRef.current;
    if (!start || movedRef.current) return;
    if (Math.abs(e.clientX - start.x) > TAP_SLOP || Math.abs(e.clientY - start.y) > TAP_SLOP) {
      movedRef.current = true;
      clearLongPress();
    }
  };

  // Если жест (или долгое нажатие) был — гасим клик, чтобы ссылка не открылась.
  // Открытая строка тоже глотает тап: он её закрывает.
  const handleClickCapture = (e: React.MouseEvent) => {
    if (movedRef.current || openRef.current) {
      e.preventDefault();
      e.stopPropagation();
      if (openRef.current && !movedRef.current) snapTo(false);
    }
    movedRef.current = false;
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        aria-hidden={false}
        style={{ opacity: actionsOpacity }}
        className="absolute inset-y-0 right-0 flex"
        // width фиксирован, чтобы кнопки не «ползли» вместе с жестом.
        data-swipe-actions>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            style={{ width: ACTION_WIDTH }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-xs font-medium active:brightness-90',
              TONE_CLASS[action.tone]
            )}
            onClick={() => {
              snapTo(false);
              action.onSelect();
            }}>
            <action.icon className="size-5" />
            <span>{action.label}</span>
          </button>
        ))}
      </motion.div>

      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        drag="x"
        dragListener={false}
        dragControls={controls}
        dragDirectionLock
        dragConstraints={{ left: -width, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        dragMomentum={false}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onClickCapture={handleClickCapture}
        onDragStart={() => {
          movedRef.current = true;
          clearLongPress();
        }}
        onDragEnd={(_, info) => {
          const shouldOpen = info.velocity.x < -400 || (info.velocity.x < 400 && x.get() < -width / 2);
          snapTo(shouldOpen);
        }}
        className="bg-card relative">
        {children}
      </motion.div>
    </div>
  );
}
