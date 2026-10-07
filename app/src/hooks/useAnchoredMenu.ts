'use client';

/**
 * useAnchoredMenu - state for a row action menu that escapes its container.
 *
 * A menu rendered `absolute` inside a docket table is trapped twice: the
 * wrapper scrolls (`overflow-x-auto`) so the panel is clipped, and it adds to
 * the scrollable area so the container grows when the menu opens. The panel is
 * therefore rendered through `Portal` with `position: fixed` and coordinates
 * measured from the trigger, flipping above the trigger when there is no room
 * below, and re-measuring while the page or the table scrolls.
 *
 * Usage:
 *   const triggerRef = useRef<HTMLDivElement | null>(null);
 *   const panelRef = useRef<HTMLDivElement | null>(null);
 *   const menu = useAnchoredMenu(triggerRef, panelRef);
 *   <div ref={triggerRef}><button onClick={menu.toggle}>…</button></div>
 *   {menu.open && (
 *     <Portal>
 *       <div ref={panelRef} role="menu" style={menu.style}>…</div>
 *     </Portal>
 *   )}
 *
 * The refs are owned by the caller and passed in, never returned: the
 * react-hooks lint rules reject reading a `useRef` value during render, and an
 * object carrying refs cannot be handed to JSX without tripping that rule.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
} from 'react';

export interface AnchoredMenuStyle {
  position: 'fixed';
  top: number;
  left: number;
  /** Hidden until the first measurement so the panel never flashes misplaced. */
  visibility: 'visible' | 'hidden';
}

/** Space between the trigger and the panel, and the minimum viewport margin. */
const GAP = 4;
const VIEWPORT_PADDING = 8;

const HIDDEN: AnchoredMenuStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  visibility: 'hidden',
};

export function useAnchoredMenu(
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<AnchoredMenuStyle>(HIDDEN);

  /** Place the panel against the trigger, flipping up near the viewport edge. */
  const reposition = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    if (!trigger || !panel) return;

    const below = trigger.bottom + GAP + panel.height;
    const openUp = below > window.innerHeight - VIEWPORT_PADDING;
    const top = openUp
      ? Math.max(VIEWPORT_PADDING, trigger.top - GAP - panel.height)
      : trigger.bottom + GAP;
    const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - panel.width - VIEWPORT_PADDING);
    const left = Math.min(Math.max(VIEWPORT_PADDING, trigger.right - panel.width), maxLeft);

    setStyle({
      position: 'fixed',
      top: Math.round(top),
      left: Math.round(left),
      visibility: 'visible',
    });
  }, [panelRef, triggerRef]);

  // Measure once the panel is in the DOM (rAF keeps the update out of the
  // effect body, which the react-hooks lint rules reject).
  useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(frame);
  }, [open, reposition]);

  // Stay glued to the trigger while the page or the docket table scrolls.
  useEffect(() => {
    if (!open) return;
    const onMove = () => reposition();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, reposition]);

  // Dismiss on outside pointer down or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, panelRef, triggerRef]);

  const toggle = useCallback(() => {
    setStyle(HIDDEN);
    setOpen((value) => !value);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { open, style, toggle, close };
}
