'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into `document.body`.
 *
 * Every page root animates in with an `animate-fluid-*` class whose keyframes
 * end on a `transform` and keep it (`animation-fill-mode: forwards`). A
 * transformed ancestor becomes the containing block for `position: fixed`
 * descendants, so an overlay rendered inside a view is positioned against that
 * wrapper instead of the viewport: clipped by the table's `overflow-x-auto`,
 * dragged along with the page, and unable to cover the chrome. Portalling to
 * body keeps modals and anchored menus in viewport coordinates.
 *
 * The host is resolved in a lazy initializer rather than an effect on purpose:
 * children must mount in the same commit as the caller's first render,
 * otherwise a measuring consumer (useAnchoredMenu) runs before the panel
 * exists. Overlays only mount after a user action, so this never runs during
 * hydration.
 */
export default function Portal({ children }: { children: ReactNode }) {
  const [host] = useState<HTMLElement | null>(() =>
    typeof document === 'undefined' ? null : document.body,
  );

  // Nothing to portal into during the server render.
  if (!host) return null;
  return createPortal(children, host);
}
