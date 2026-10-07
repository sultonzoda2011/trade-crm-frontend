import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'react-router';

/** How long the mark takes to draw itself. The splash never leaves before this, so the animation is never cut in half. */
const MIN_VISIBLE_MS = 2000;
const EXIT_MS = 380;

const WORDMARK = 'TradeCRM';

/**
 * Cold-start screen.
 *
 * The mark is the app's own logo, drawn the way the product works: a ledger page
 * gets written line by line, then the entry is closed with a check. It is plain
 * SVG + CSS keyframes (see `#app-splash` in global.css) on purpose — this is
 * rendered into the static SPA shell, so it paints before any JS has loaded and
 * must not depend on the animation library.
 *
 * It leaves when both are true: the router is idle and the drawing has finished.
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
        <svg className="splash-mark" viewBox="0 0 120 120" role="img" aria-label="TradeCRM" overflow="visible">
          {/* The page */}
          <g className="splash-page">
            <path
              className="splash-page-body"
              d="M28 6H62L94 38V92A22 22 0 0 1 72 114H28A22 22 0 0 1 6 92V28A22 22 0 0 1 28 6Z"
            />
            <path className="splash-page-fold" d="M62 6L94 38H70A8 8 0 0 1 62 30Z" />
            <rect className="splash-spine" x="17" y="20" width="9" height="80" rx="4.5" />
            <rect className="splash-line splash-line-1" x="36" y="38" width="34" height="8" rx="4" />
            <rect className="splash-line splash-line-2" x="36" y="54" width="44" height="8" rx="4" />
            <rect className="splash-line splash-line-3" x="36" y="70" width="26" height="8" rx="4" />
          </g>

          {/* The entry is closed */}
          <g className="splash-badge">
            <circle className="splash-badge-pulse" cx="86" cy="88" r="22" />
            <circle className="splash-badge-disc" cx="86" cy="88" r="22" />
            <path className="splash-badge-check" d="M76 88.5L83.5 96L97 80.5" pathLength="1" />
          </g>
        </svg>

        <div className="splash-word" aria-hidden="true">
          {WORDMARK.split('').map((char, index) => (
            <span key={index} style={{ ['--i' as string]: index }}>
              {char}
            </span>
          ))}
        </div>

        <div className="splash-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
