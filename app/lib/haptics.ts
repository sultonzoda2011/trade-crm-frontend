/**
 * Tactile feedback for gestures and key actions.
 *
 * In the Android shell this goes through the native Capacitor Haptics plugin
 * when it is installed (`npm i @capacitor/haptics && npx cap sync`), which is the
 * only route that feels like a real system tap. Without it, or in a browser, it
 * falls back to the Vibration API where the WebView allows it, and otherwise
 * does nothing — callers never need to check support.
 */
type HapticKind = 'selection' | 'light' | 'medium' | 'success' | 'warning';

interface HapticsPlugin {
  impact?: (options: { style: 'LIGHT' | 'MEDIUM' | 'HEAVY' }) => Promise<void>;
  selectionChanged?: () => Promise<void>;
  notification?: (options: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }) => Promise<void>;
}

const FALLBACK_VIBRATION_MS: Record<HapticKind, number | number[]> = {
  selection: 6,
  light: 10,
  medium: 18,
  success: [10, 40, 10],
  warning: [18, 50, 18],
};

function nativePlugin(): HapticsPlugin | undefined {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> } })
    .Capacitor;
  if (!cap?.isNativePlatform?.()) return undefined;
  return cap.Plugins?.Haptics as HapticsPlugin | undefined;
}

export function haptic(kind: HapticKind = 'light'): void {
  if (typeof window === 'undefined') return;

  try {
    const native = nativePlugin();
    if (native) {
      if (kind === 'selection') void native.selectionChanged?.();
      else if (kind === 'success') void native.notification?.({ type: 'SUCCESS' });
      else if (kind === 'warning') void native.notification?.({ type: 'WARNING' });
      else void native.impact?.({ style: kind === 'medium' ? 'MEDIUM' : 'LIGHT' });
      return;
    }

    navigator.vibrate?.(FALLBACK_VIBRATION_MS[kind]);
  } catch {
    // Feedback is a nicety; never let it break the gesture that triggered it.
  }
}
