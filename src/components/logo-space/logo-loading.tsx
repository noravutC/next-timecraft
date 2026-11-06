'use client';

import { useId, useLayoutEffect, useRef } from 'react';

import { LOGO_COLOR, LOGO_DASH, LOGO_T_PATH } from './logo-mark';

interface LogoLoadingProps {
  size?: number;
  /** Fill/stroke color, e.g. white on a dark button. Defaults to the brand. */
  color?: string;
  className?: string;
  /** Accessible name; omit when a parent element already announces loading. */
  label?: string;
}

// Animated TimeCraft mark: the T and its dash draw themselves in a loop over a
// faint copy of the mark. Keyframes live in globals.css (tc-logo-*); with
// reduced motion the mark gently pulses instead of drawing.
export const LogoLoading = ({
  size = 56,
  color = LOGO_COLOR,
  className,
  label,
}: LogoLoadingProps) => {
  const ref = useRef<SVGSVGElement>(null);
  const clipId = `tc-logo-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Pin the loop to the page timeline. Loading screens hand over to each other
  // within a few hundred ms; without this every new loader restarts at the
  // faint first frame and the mark never visibly draws.
  useLayoutEffect(() => {
    ref.current?.getAnimations({ subtree: true }).forEach((animation) => {
      animation.startTime = 0;
    });
  }, []);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      className={className}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={LOGO_T_PATH} />
          <rect {...LOGO_DASH} />
        </clipPath>
      </defs>
      <g fill={color} className="tc-logo-base">
        <path d={LOGO_T_PATH} />
        <rect {...LOGO_DASH} />
      </g>
      <g clipPath={`url(#${clipId})`}>
        <g className="tc-logo-loop">
          <g
            stroke={color}
            strokeWidth={44}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path className="tc-logo-bar" d="M48 62H208" pathLength={1} />
            <path
              className="tc-logo-stem"
              d="M127 80V173Q127 195 104 195H91"
              pathLength={1}
            />
          </g>
          <rect className="tc-logo-dash" {...LOGO_DASH} fill={color} />
        </g>
      </g>
    </svg>
  );
};
