import { create } from 'zustand';
import { haptic } from '~/lib/haptics';

export interface SuccessPayload {
  /** What just happened, already translated — «Оплата успешно проведена». */
  title: string;
  /** One quiet line under the title. */
  description?: string;
  /** A sum worth showing big: the payment, the refund, the payout. Counts up on screen. */
  amount?: number;
  /** How long it stays before dismissing itself, ms. */
  duration?: number;
}

interface SuccessState {
  current: (SuccessPayload & { id: number }) | null;
  show: (payload: SuccessPayload) => void;
  hide: () => void;
}

let nextId = 1;

export const useSuccessStore = create<SuccessState>((set) => ({
  current: null,
  show: (payload) => set({ current: { ...payload, id: nextId++ } }),
  hide: () => set({ current: null }),
}));

/**
 * Celebrate a finished action: the check mark draws itself, the phone taps back.
 *
 * Reserved for moments that deserve it — money moved, a deal was recorded, a
 * credential changed. Routine saves stay a toast. Callable from anywhere (a
 * mutation's `onSuccess`, a modal that is about to unmount) because the dialog
 * itself lives in the CRM layout, not in the caller.
 */
export function showSuccess(payload: SuccessPayload): void {
  haptic('success');
  useSuccessStore.getState().show(payload);
}
