import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'react-router';

/** How long the mark takes to draw itself. The splash never leaves before this, so the animation is never cut in half. */
const MIN_VISIBLE_MS = 1700;
const EXIT_MS = 380;

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
 */
export function Splash() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const navigation = useNavigation();

  const routerIdle = navigation.state === 'idle';

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

  if (gone) return null;

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
