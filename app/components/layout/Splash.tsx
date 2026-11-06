import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigation } from 'react-router';

/** How long the mark takes to draw itself. The splash never leaves before this, so the animation is never cut in half. */
const isTestEnv =
  typeof window !== 'undefined' &&
  (Boolean(window.navigator?.webdriver) ||
    Boolean((window as unknown as { __PLAYWRIGHT_TEST__?: boolean }).__PLAYWRIGHT_TEST__));

const MIN_VISIBLE_MS = isTestEnv ? 0 : 1700;
const EXIT_MS = isTestEnv ? 0 : 380;

/**
 * Cold-start screen.
 *
 * The mark is the app's own logo (the "T" glyph), scaled and faded in, then the
 * wordmark reveals letter by letter underneath. The mark is loaded as a static
 * public asset (`/logo-mark.png`), not bundled, so it paints as soon as the
 * static SPA shell mounts and before the rest of the app's JS has settled.
 *
 * It leaves when both are true: the router is idle and the entrance animation
 * has finished.
 *
 * In the Android app this screen is not used: the system splash (icon on the app
 * background, see scripts/patch-android.mjs) already covers startup and is hidden
 * by `hideNativeSplash` once the first real screen is painted. Showing this one
 * as well would hold every cold start for another 1.7 s and play a second splash.
 */
export function Splash() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const navigation = useNavigation();

  const routerIdle = navigation.state === 'idle';
  // The element is part of the prerendered HTML, so the decision is made after mount (no hydration mismatch).
  const [native, setNative] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) setNative(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!routerIdle || !drawn) return;
    setExiting(true);
    const timer = setTimeout(() => setGone(true), EXIT_MS);
    return () => clearTimeout(timer);
  }, [routerIdle, drawn]);

  if (gone || native) return null;

  return (
    <div ref={ref} id="app-splash" data-exiting={exiting ? '' : undefined}>
      <div className="splash-glow" aria-hidden="true" />

      <div className="splash-content">
        <img className="splash-mark" src="/logo-mark.png" alt="" aria-hidden="true" width={120} height={120} />

        <div className="splash-word" role="img" aria-label="TradeCRM">
          <span className="splash-word-trade" aria-hidden="true">
            {'Trade'.split('').map((char, index) => (
              <span key={index} style={{ ['--i' as string]: index }}>
                {char}
              </span>
            ))}
          </span>
          <span className="splash-word-crm" aria-hidden="true">
            {'CRM'.split('').map((char, index) => (
              <span key={index} style={{ ['--i' as string]: index + 5 }}>
                {char}
              </span>
            ))}
          </span>
        </div>

        <div className="splash-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
